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

export default {
  fetchVaccines,
  getVaccineById,
};
