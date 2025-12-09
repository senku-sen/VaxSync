import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Centralized list of supported barangays used by UI dropdowns (ALL CAPS)
export const BARANGAYS = [
  "ALAWIHAO",
  "BIBIRAO",
  "CALASGASAN",
  "CAMAMBUGAN",
  "DOGONGAN",
  "MAGANG",
  "MANCRUZ",
  "PAMORANGAN",
  "BARANGAY II",
  "BUNAWAN",
  "CONSUELO",
  "IMELDA",
  "LA PAZ",
  "LIBUAN",
  "LORETO",
  "MAHAYAG",
  "NEW VISAYAS",
  "POBLACION",
  "SAN ANDRES",
  "SAN MARCOS",
  "TAGBAY",
];