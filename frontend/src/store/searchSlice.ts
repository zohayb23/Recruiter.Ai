import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { QueryTemplate, SearchState } from '../types';

const initialState: SearchState = {
  templates: [],
  currentTemplate: null,
  suggestions: [],
  recentSearches: [],
  loading: false,
  error: null,
};

const searchSlice = createSlice({
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
    setCurrentTemplate: (state, action: PayloadAction<QueryTemplate | null>) => {
      state.currentTemplate = action.payload;
    },
    setSuggestions: (state, action: PayloadAction<string[]>) => {
      state.suggestions = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  saveTemplate,
  deleteTemplate,
  setCurrentTemplate,
  setSuggestions,
  setLoading,
  setError,
} = searchSlice.actions;

export default searchSlice.reducer; 