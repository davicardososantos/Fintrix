import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Compõe classes Tailwind com merge inteligente (evita conflitos). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
