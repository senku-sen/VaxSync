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
 * Fetch vaccine requests for current user (Health Worker) or all (Head Nurse via RLS)
 * @param {Object} options - Query options
 * @param {string} options.barangayId - Optional barangay ID to filter by
 * @param {boolean} options.isAdmin - If true, fetch all requests (Head Nurse)
 * @param {string} options.userId - Current user ID (from localStorage)
 * @returns {Promise<{ data: Array, error: Object }>}
 */
export async function fetchVaccineRequests(options = {}) {
  let query = supabase
    .from("vaccine_requests")
    .select("*")
    .order("created_at", { ascending: false });

  // Health Worker: only see their own requests
  // Head Nurse: RLS policy will allow them to see all
  if (!options.isAdmin && options.userId) {
    query = query.eq("requested_by", options.userId);
  }

  if (options.barangayId) {
    query = query.eq("barangay_id", options.barangayId);
  }

  const { data, error } = await query;
  return { data, error };
}

/**
 * Load vaccine requests with error handling
 * @param {Object} options - Query options
 * @param {boolean} options.isAdmin - If true, fetch all requests (Head Nurse)
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export const loadVaccineRequestsData = async (options = {}) => {
  try {
    // Get user ID from localStorage for client-side filtering
    const userData = localStorage.getItem('vaxsync_user');
    let userId = null;
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        userId = parsed.id;
      } catch (e) {
        console.warn('Failed to parse user data from localStorage');
      }
    }

    const { data, error } = await fetchVaccineRequests({
      ...options,
      userId
    });
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
 * @param {Object} request - The request data (must include requested_by: userId)
 * @returns {Promise<{ data: Object, error: Object }>}
 */
export async function createVaccineRequest(request) {
  if (!request.requested_by) {
    console.error('requested_by is required');
    return { data: null, error: { message: 'User ID is required' } };
  }

  console.log('Creating vaccine request for user:', request.requested_by);
  console.log('Request data:', request);

  const requestData = {
    ...request,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  console.log('Final request data to insert:', requestData);

  const { data, error } = await supabase
    .from("vaccine_requests")
    .insert([requestData])
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', error);
  }

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
 * Update vaccine request status with error handling (for admin)
 * @param {string} requestId - The request ID
 * @param {string} status - The new status (pending, approved, rejected, released)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateVaccineRequestStatus = async (requestId, status) => {
  try {
    const { error } = await updateVaccineRequest(requestId, { status });
    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.error('Error updating request status:', err);
    return { success: false, error: err.message || 'Failed to update request status' };
  }
};

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
  updateVaccineRequestStatus,
  fetchVaccineRequests,
  createVaccineRequest,
  updateVaccineRequest,
  deleteVaccineRequest,
};
