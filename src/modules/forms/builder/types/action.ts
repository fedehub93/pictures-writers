export type SubmitActionType = "toast" | "redirect";

export interface ToastActionConfig {
  type: "toast";
  successMessage: string;
}

export interface RedirectActionConfig {
  type: "redirect";
  url: string;
}

export type ActionConfigUnion = ToastActionConfig | RedirectActionConfig;
