import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFirstCharUppercase(s: string) {
  return s.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}
