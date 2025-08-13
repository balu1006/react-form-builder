import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FormBuilderState, FormSchema, FormField, ValidationRule } from '../types';

const initialState: FormBuilderState = {
  currentForm: null,
  savedForms: [],
  currentFieldId: 1,
  previewData: {},
  validationErrors: {}
};

const formBuilderSlice = createSlice({
  name: 'formBuilder',
  initialState,
  reducers: {
    createNewForm: (state) => {
      state.currentForm = {
        id: Date.now().toString(),
        name: '',
        fields: [],
        createdAt: new Date().toISOString()
      };
      state.previewData = {};
      state.validationErrors = {};
    },
    
    addField: (state, action: PayloadAction<Omit<FormField, 'id' | 'order'>>) => {
      if (!state.currentForm) return;
      
      const newField: FormField = {
        ...action.payload,
        id: `field_${state.currentFieldId}`,
        order: state.currentForm.fields.length
      };
      
      state.currentForm.fields.push(newField);
      state.currentFieldId++;
    },
    
    updateField: (state, action: PayloadAction<FormField>) => {
      if (!state.currentForm) return;
      
      const index = state.currentForm.fields.findIndex(f => f.id === action.payload.id);
      if (index !== -1) {
        state.currentForm.fields[index] = action.payload;
      }
    },
    
    deleteField: (state, action: PayloadAction<string>) => {
      if (!state.currentForm) return;
      
      state.currentForm.fields = state.currentForm.fields
        .filter(f => f.id !== action.payload)
        .map((f, index) => ({ ...f, order: index }));
    },
    
    reorderFields: (state, action: PayloadAction<FormField[]>) => {
      if (!state.currentForm) return;
      
      state.currentForm.fields = action.payload.map((f, index) => ({
        ...f,
        order: index
      }));
    },
    
    saveForm: (state, action: PayloadAction<string>) => {
      if (!state.currentForm) return;
      
      const formToSave = {
        ...state.currentForm,
        name: action.payload,
        createdAt: new Date().toISOString()
      };
      
      const existingIndex = state.savedForms.findIndex(f => f.id === formToSave.id);
      if (existingIndex !== -1) {
        state.savedForms[existingIndex] = formToSave;
      } else {
        state.savedForms.push(formToSave);
      }
      
      // Save to localStorage
      localStorage.setItem('formBuilderForms', JSON.stringify(state.savedForms));
    },
    
    loadSavedForms: (state) => {
      const saved = localStorage.getItem('formBuilderForms');
      if (saved) {
        state.savedForms = JSON.parse(saved);
      }
    },
    
    loadForm: (state, action: PayloadAction<string>) => {
      const form = state.savedForms.find(f => f.id === action.payload);
      if (form) {
        state.currentForm = { ...form };
        state.previewData = {};
        state.validationErrors = {};
      }
    },
    
    updatePreviewData: (state, action: PayloadAction<{ fieldId: string; value: any }>) => {
      state.previewData[action.payload.fieldId] = action.payload.value;
    },
    
    setValidationErrors: (state, action: PayloadAction<Record<string, string[]>>) => {
      state.validationErrors = action.payload;
    },
    
    clearValidationErrors: (state) => {
      state.validationErrors = {};
    }
  }
});

export const {
  createNewForm,
  addField,
  updateField,
  deleteField,
  reorderFields,
  saveForm,
  loadSavedForms,
  loadForm,
  updatePreviewData,
  setValidationErrors,
  clearValidationErrors
} = formBuilderSlice.actions;

export const store = configureStore({
  reducer: {
    formBuilder: formBuilderSlice.reducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
