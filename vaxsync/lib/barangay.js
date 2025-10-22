import { supabase } from "./supabase";

export async function fetchBarangays() {
  const { data, error } = await supabase
    .from("barangays")
    .select("*")
    .order("created_at", { ascending: false });
  return { data, error };
}

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

export default {
  fetchBarangays,
  insertBarangay,
  updateBarangay,
};
