import axios from "axios";

/**
 * Extracts the user-facing message the media API puts in `{ error }`.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  return axios.isAxiosError(error) &&
    typeof error.response?.data?.error === "string"
    ? error.response.data.error
    : fallback;
}
