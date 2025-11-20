// ============================================
// BARANGAY MANAGEMENT BUSINESS LOGIC
// ============================================
// This file contains all data operations for barangays.
// Use these functions in pages/headNurse/barangay-management.jsx
// ============================================

import { supabase } from "./supabase";

// Fetch all barangays from database with assigned health worker details
export async function fetchBarangays() {
  const { data, error } = await supabase
    .from("barangays")
    .select(`
      *,
      assigned_health_worker(id, first_name, last_name)
    `)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching barangays:", error);
  }
  
  return { data, error };
}

// Insert a new barangay
export async function insertBarangay(payload) {
  try {
    const { data, error, status, statusText } = await supabase
      .from("barangays")
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
      .from("barangays")
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
      .from("barangays")
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
