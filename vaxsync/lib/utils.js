import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Centralized list of supported barangays used by UI dropdowns
export const BARANGAYS = [
  "Alawihao",
  "Bibirao",
  "Calasgasan",
  "Camambugan",
  "Dogongan",
  "Magang",
  "Mancruz",
  "Pamorangan",
  "Barangay II"
];