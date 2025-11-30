import { supabase } from "./supabase";

export async function fetchVaccines() {
  const { data, error } = await supabase
    .from("vaccines")
    .select("*")
    .order("name");
  return { data, error };
}

export async function getVaccineById(id) {
  const { data, error } = await supabase
    .from("vaccines")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function createVaccine(vaccineData) {
  const { data, error } = await supabase
    .from("vaccines")
    .insert([vaccineData])
    .select()
    .single();
  return { data, error };
}

export async function updateVaccine(id, vaccineData) {
  const { data, error } = await supabase
    .from("vaccines")
    .update(vaccineData)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteVaccine(id) {
  const { data, error } = await supabase
    .from("vaccines")
    .delete()
    .eq("id", id);
  return { data, error };
}

export default {
  fetchVaccines,
  getVaccineById,
  createVaccine,
  updateVaccine,
  deleteVaccine,
};
