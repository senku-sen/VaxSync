import { supabase } from "./supabase";
import { getUserProfile } from "./accAuth";
import { fetchVaccines } from "./vaccine";

/**
 * Fetch and validate user profile from localStorage and Supabase
 * @returns {Promise<Object|null>} User profile with barangay info or null if not authenticated
 */
export const loadUserProfile = async () => {
  try {
    console.log('fetchUserProfile started');
    
    // Check localStorage first
    const userData = localStorage.getItem('vaxsync_user');
    console.log('localStorage vaxsync_user:', userData);
    if (!userData) {
      console.warn('No user in localStorage, redirecting to /pages/signin');
      window.location.href = '/pages/signin';
      return null;
    }

    // Parse and validate cached user data
    let cachedUser;
    try {
      cachedUser = JSON.parse(userData);
      console.log('Parsed cached user:', cachedUser);
    } catch (e) {
      console.warn('Failed to parse cached user data:', e);
      localStorage.removeItem('vaxsync_user');
      window.location.href = '/pages/signin';
      return null;
    }

    if (!cachedUser.id) {
      console.warn('Cached user missing id, redirecting to /pages/signin');
      window.location.href = '/pages/signin';
      return null;
    }

    // Get profile with barangay using cached user id
    const profile = await getUserProfile(cachedUser.id);
    console.log('User profile fetched:', profile);
    if (!profile) {
      console.warn('No profile found');
      return null;
    }

    return profile;
  } catch (err) {
    console.error('Error in loadUserProfile:', err);
    window.location.href = '/pages/signin';
    return null;
  }
};

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
 * Load vaccine requests with error handling
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export const loadVaccineRequestsData = async () => {
  try {
    const { data, error } = await fetchVaccineRequests();
    console.log('fetchVaccineRequests result:', { data, error });
    if (error) {
      console.error('Supabase error details:', error);
      const errorMsg = error?.message || error?.details || JSON.stringify(error) || 'Unknown error';
      throw new Error(errorMsg);
    }
    
    console.log('Fetched requests:', data?.length || 0);
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error loading requests:', err);
    return { data: [], error: err.message || 'Failed to load requests' };
  }
};

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

/**
 * Load vaccines with error handling
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export const loadVaccinesData = async () => {
  try {
    const { data, error } = await fetchVaccines();
    console.log('fetchVaccines result:', { data, error });
    if (error) {
      console.error('Supabase error details:', error);
      const errorMsg = error?.message || error?.details || JSON.stringify(error) || 'Unknown error';
      throw new Error(errorMsg);
    }
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error loading vaccines:', err);
    return { data: [], error: err.message || 'Failed to load vaccines' };
  }
};

/**
 * Delete a vaccine request with error handling
 * @param {string} requestId - The request ID to delete
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const deleteVaccineRequestData = async (requestId) => {
  try {
    const { error } = await deleteVaccineRequest(requestId);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.error('Error deleting request:', err);
    return { success: false, error: err.message || 'Failed to delete request' };
  }
};

/**
 * Create a new vaccine request with error handling
 * @param {Object} formData - The request form data
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const createVaccineRequestData = async (formData) => {
  try {
    const { data, error } = await createVaccineRequest(formData);
    if (error) throw error;
    return { success: true, error: null, data };
  } catch (err) {
    console.error('Error submitting request:', err);
    return { success: false, error: err.message || 'Failed to submit request', data: null };
  }
};

export default {
  loadUserProfile,
  loadVaccineRequestsData,
  loadVaccinesData,
  deleteVaccineRequestData,
  createVaccineRequestData,
  fetchVaccineRequests,
  createVaccineRequest,
  updateVaccineRequest,
  deleteVaccineRequest,
};
