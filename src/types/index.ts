export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'email' | 'password' | 'min' | 'max';
  value?: string | number;
  message?: string;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface DerivedField {
  parentFields: string[];
  formula: string;
  type: 'age' | 'fullName' | 'calculation' | 'conditional';
}

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date';
  label: string;
  required: boolean;
  defaultValue?: string | string[] | boolean;
  validation: ValidationRule[];
  options?: SelectOption[];
  isDerived?: boolean;
  derivedConfig?: DerivedField;
  order: number;
}

export interface FormSchema {
  id: string;
  name: string;
  fields: FormField[];
  createdAt: string;
}

export interface FormBuilderState {
  currentForm: FormSchema | null;
  savedForms: FormSchema[];
  currentFieldId: number;
  previewData: Record<string, any>;
  validationErrors: Record<string, string[]>;
}
