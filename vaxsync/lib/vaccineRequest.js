import { supabase } from "./supabase";

/**
 * Fetch all vaccine requests
 * @param {Object} options - Query options
 * @param {string} options.barangayId - Optional barangay ID to filter by
 * @returns {Promise<{ data: Array, error: Object }>}
 */
export async function fetchVaccineRequests(options = {}) {
  let query = supabase
    .from("vaccine_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (options.barangayId) {
    query = query.eq("barangay_id", options.barangayId);
  }

  const { data, error } = await query;
  return { data, error };
}

/**
 * Create a new vaccine request
 * @param {Object} request - The request data
 * @returns {Promise<{ data: Object, error: Object }>}
 */
export async function createVaccineRequest(request) {
  const { data, error } = await supabase
    .from("vaccine_requests")
    .insert([
      {
        ...request,
        status: "pending",
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  return { data, error };
}

/**
 * Update a vaccine request
 * @param {string|number} id - The request ID
 * @param {Object} updates - The fields to update
 * @returns {Promise<{ data: Object, error: Object }>}
 */
export async function updateVaccineRequest(id, updates) {
  const { data, error } = await supabase
    .from("vaccine_requests")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a vaccine request
 * @param {string|number} id - The request ID
 * @returns {Promise<{ data: Object, error: Object }>}
 */
export async function deleteVaccineRequest(id) {
  const { data, error } = await supabase
    .from("vaccine_requests")
    .delete()
    .eq("id", id);

  return { data, error };
}

export default {
  fetchVaccineRequests,
  createVaccineRequest,
  updateVaccineRequest,
  deleteVaccineRequest,
};
