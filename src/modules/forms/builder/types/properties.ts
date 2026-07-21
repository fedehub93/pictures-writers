import type { ActionConfigUnion } from "./action";

// --- Validation Base ---
export interface BaseValidation {
  required: boolean;
}

// --- Root ---
interface FormSubmissionConfig {
  onSuccess: ActionConfigUnion;
}
export interface RootProperties {
  theme?: string;
  submission: FormSubmissionConfig;
}

// --- Elements Base ---
export interface BaseFieldProperties {
  name: string;
  label: string;
  helperText: string;
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
  placeholder: string;
  inputType: TextInputEnum;
  validation: TextFieldValidation;
}

export interface TextareaFieldValidation extends BaseValidation {
  minLength?: number;
  maxLength?: number;
}

export interface TextareaFieldProperties extends BaseFieldProperties {
  placeholder: string;
  validation: TextareaFieldValidation;
}

export interface SelectFieldProperties extends BaseFieldProperties {
  placeholder: string;
  options: string[];
}

export interface UploadFieldProperties extends BaseFieldProperties {
  files: {
    key: string;
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
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

export interface ParagraphProperties extends BaseDisplayProperties {
  content: any; // Da tipizzare meglio quando aggancerai i dati del Rich Text
}

export interface ButtonProperties extends BaseDisplayProperties {
  label: string;
}
