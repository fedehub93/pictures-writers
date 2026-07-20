// --- Validation Base ---
export interface BaseValidation {
  required: boolean;
}

// --- Root ---
export interface RootProperties {
  theme?: string;
}

// --- Elements Base ---
export interface BaseFieldProperties {
  name: string;
  label: string;
  helperText: string;
  placeholder: string;
  validation: BaseValidation;
}

// --- Specific Elements ---
export interface TextFieldValidation extends BaseValidation {
  minLength?: number;
  maxLength?: number;
}

export enum TextInputEnum {
  Text = "text",
  Email = "email",
}

export interface TextFieldProperties extends BaseFieldProperties {
  inputType: TextInputEnum;
  validation: TextFieldValidation;
}

export interface TextareaFieldValidation extends BaseValidation {
  minLength?: number;
  maxLength?: number;
}

export interface TextareaFieldProperties extends BaseFieldProperties {
  validation: TextareaFieldValidation;
}

export interface SelectFieldProperties extends BaseFieldProperties {
  options: string[];
}

// --- Layouts ---
export interface BaseLayoutProperties {
  label: string;
}

export interface GridLayoutProperties extends BaseLayoutProperties {
  columns?: number;
  gap?: number;
}

// --- Displays ---
export interface BaseDisplayProperties {
  label: string;
}

export interface ParagraphProperties extends BaseLayoutProperties {
  content: any; // Da tipizzare meglio quando aggancerai i dati del Rich Text
}
