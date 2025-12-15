import { supabase } from "./supabase";

export async function fetchVaccines() {
  const { data, error } = await supabase
    .from("Vaccines")
    .select("*")
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function deleteVaccineById(id) {
  if (!id) return { error: new Error("Missing id") };
  const { data, error } = await supabase.from("Vaccines").delete().eq("id", id);
  return { data, error };
}

export async function insertVaccine(vaccine) {
  const { data, error } = await supabase
    .from("Vaccines")
    .insert(vaccine)
    .select();
  return { data, error };
}

export async function updateVaccine(id, patch) {
  const { data, error } = await supabase
    .from("Vaccines")
    .update(patch)
    .eq("id", id)
    .select();
  return { data, error };
}

export default {
  fetchVaccines,
  deleteVaccineById,
  insertVaccine,
  updateVaccine,
};
