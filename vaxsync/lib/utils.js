import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Central list of barangays used across the app (Head Nurse / Health Worker views, filters, etc.)
// NOTE: Update this list if your Barangays table in Supabase changes.
// Having this defined here avoids runtime errors when components map over BARANGAYS.
export const BARANGAYS = [
  "Bunawan",
  "Consuelo",
  "Imelda",
  "La Paz",
  "Libuan",
  "Loreto",
  "Mahayag",
  "New Visayas",
  "Poblacion",
  "San Andres",
  "San Marcos",
  "Tagbay",
];