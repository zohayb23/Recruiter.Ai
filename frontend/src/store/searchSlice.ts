import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { QueryTemplate, QueryGroup } from '../types';

export interface SearchState {
  templates: QueryTemplate[];
  suggestions: string[];
  synonyms: string[];
  relatedSkills: string[];
  didYouMean: string[];
  loading: boolean;
  error: string | null;
}

const initialState: SearchState = {
  templates: [],
  suggestions: [],
  synonyms: [],
  relatedSkills: [],
  didYouMean: [],
  loading: false,
  error: null,
};

export const fetchSkillSuggestions = createAsyncThunk(
  'search/fetchSkillSuggestions',
  async (skill: string) => {
    const response = await fetch('http://localhost:8000/api/skills/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ skill }),
    });
    const data = await response.json();
    return data;
  }
);

export const fetchDidYouMean = createAsyncThunk(
  'search/fetchDidYouMean',
  async (skill: string) => {
    const response = await fetch('http://localhost:8000/api/skills/did-you-mean', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ skill }),
    });
    const data = await response.json();
    return data.suggestions;
  }
);

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    saveTemplate: (state, action: PayloadAction<QueryTemplate>) => {
      const existingIndex = state.templates.findIndex(t => t.id === action.payload.id);
      if (existingIndex >= 0) {
        state.templates[existingIndex] = action.payload;
      } else {
        state.templates.push(action.payload);
      }
    },
    deleteTemplate: (state, action: PayloadAction<string>) => {
      state.templates = state.templates.filter(t => t.id !== action.payload);
    },
    clearSuggestions: (state) => {
      state.suggestions = [];
      state.synonyms = [];
      state.relatedSkills = [];
      state.didYouMean = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkillSuggestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSkillSuggestions.fulfilled, (state, action) => {
        state.loading = false;
        state.synonyms = action.payload.synonyms;
        state.relatedSkills = action.payload.related_skills;
      })
      .addCase(fetchSkillSuggestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch suggestions';
      })
      .addCase(fetchDidYouMean.fulfilled, (state, action) => {
        state.didYouMean = action.payload;
      });
  },
});

export const { saveTemplate, deleteTemplate, clearSuggestions } = searchSlice.actions;

export default searchSlice.reducer; 