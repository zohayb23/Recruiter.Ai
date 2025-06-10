import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { QueryGroup, QueryTemplate } from '../types';

interface SearchState {
  templates: QueryTemplate[];
  suggestions: {
    skills: Array<{
      skill: string;
      type: 'primary' | 'synonym';
      related?: string[];
      primary_skill?: string;
    }>;
    didYouMean: string[];
    related: string[];
  };
  loading: {
    suggestions: boolean;
    templates: boolean;
  };
  error: string | null;
}

const initialState: SearchState = {
  templates: [],
  suggestions: {
    skills: [],
    didYouMean: [],
    related: [],
  },
  loading: {
    suggestions: false,
    templates: false,
  },
  error: null,
};

// Async thunks
export const fetchSkillSuggestions = createAsyncThunk(
  'search/fetchSkillSuggestions',
  async (partial: string) => {
    const response = await fetch('/api/skills/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partial, max_suggestions: 5 }),
    });
    const data = await response.json();
    return data.suggestions;
  }
);

export const fetchRelatedSkills = createAsyncThunk(
  'search/fetchRelatedSkills',
  async (skill: string) => {
    const response = await fetch('/api/skills/related', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill }),
    });
    const data = await response.json();
    return data.related_skills;
  }
);

export const fetchDidYouMean = createAsyncThunk(
  'search/fetchDidYouMean',
  async (skill: string) => {
    const response = await fetch('/api/skills/did-you-mean', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill }),
    });
    const data = await response.json();
    return data.suggestions;
  }
);

export const saveTemplate = createAsyncThunk(
  'search/saveTemplate',
  async (template: QueryTemplate) => {
    // Here you would typically save to backend
    // For now, we'll just return the template
    return template;
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    clearSuggestions: (state) => {
      state.suggestions = initialState.suggestions;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkillSuggestions.pending, (state) => {
        state.loading.suggestions = true;
      })
      .addCase(fetchSkillSuggestions.fulfilled, (state, action) => {
        state.loading.suggestions = false;
        state.suggestions.skills = action.payload;
      })
      .addCase(fetchSkillSuggestions.rejected, (state, action) => {
        state.loading.suggestions = false;
        state.error = action.error.message || 'Failed to fetch suggestions';
      })
      .addCase(fetchRelatedSkills.fulfilled, (state, action) => {
        state.suggestions.related = action.payload;
      })
      .addCase(fetchDidYouMean.fulfilled, (state, action) => {
        state.suggestions.didYouMean = action.payload;
      })
      .addCase(saveTemplate.fulfilled, (state, action) => {
        state.templates.push(action.payload);
      });
  },
});

export const { clearSuggestions, clearError } = searchSlice.actions;
export default searchSlice.reducer; 