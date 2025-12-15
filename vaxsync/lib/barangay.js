// ============================================
// BARANGAY MANAGEMENT BUSINESS LOGIC
// ============================================
// This file contains all data operations for barangays.
// Use these functions in pages/headNurse/barangay-management.jsx
// ============================================

import { supabase } from "./supabase";

// Fetch all barangays from database with assigned health worker details
// Deduplicates to keep only UPPERCASE versions with valid municipality
export async function fetchBarangays() {
  const { data, error } = await supabase
    .from("Barangays")
    .select(`
      *,
      assigned_health_worker(id, first_name, last_name)
    `)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching barangays:", error);
    return { data: [], error };
  }

  // Deduplicate barangays - keep UPPERCASE versions with valid municipality
  const barangayMap = new Map();
  (data || []).forEach(barangay => {
    const normalizedName = barangay.name.toUpperCase();
    const existing = barangayMap.get(normalizedName);
    
    // Prefer barangays that:
    // 1. Are already uppercase
    // 2. Have a valid municipality (not "Unknown")
    const isUppercase = barangay.name === barangay.name.toUpperCase();
    const hasValidMunicipality = barangay.municipality && barangay.municipality.toLowerCase() !== 'unknown';
    
    if (!existing) {
      barangayMap.set(normalizedName, barangay);
    } else {
      const existingIsUppercase = existing.name === existing.name.toUpperCase();
      const existingHasValidMunicipality = existing.municipality && existing.municipality.toLowerCase() !== 'unknown';
      
      // Replace if current is better (uppercase + valid municipality)
      if ((isUppercase && !existingIsUppercase) || 
          (hasValidMunicipality && !existingHasValidMunicipality) ||
          (isUppercase && hasValidMunicipality && (!existingIsUppercase || !existingHasValidMunicipality))) {
        barangayMap.set(normalizedName, barangay);
      }
    }
  });

  // Convert back to array and sort by name
  const deduplicatedBarangays = Array.from(barangayMap.values())
    .sort((a, b) => a.name.localeCompare(b.name));

  return { data: deduplicatedBarangays, error: null };
}

// Insert a new barangay
export async function insertBarangay(payload) {
  try {
    const { data, error, status, statusText } = await supabase
      .from("Barangays")
      .insert(payload)
      .select();
    if (error) {
      return { data: null, error: { ...error, status, statusText } };
    }
    return { data: data || null, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: err.message || String(err), stack: err.stack },
    };
  }
}

// Update an existing barangay
export async function updateBarangay(id, payload) {
  try {
    const { data, error, status, statusText } = await supabase
      .from("Barangays")
      .update(payload)
      .eq("id", id)
      .select();

    if (error) {
      return { data: null, error: { ...error, status, statusText } };
    }

    return { data: data || null, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: err.message || String(err), stack: err.stack },
    };
  }
}

/** Delete a barangay by id */
export async function deleteBarangay(id) {
  try {
    const { data, error, status, statusText } = await supabase
      .from("Barangays")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      return { data: null, error: { ...error, status, statusText } };
    }

    return { data: data || null, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: err.message || String(err), stack: err.stack },
    };
  }
}

export default {
  fetchBarangays,
  insertBarangay,
  updateBarangay,
  deleteBarangay,
};
