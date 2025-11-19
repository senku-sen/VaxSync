import { supabase } from "./supabase";
import { getUserProfile } from "./accAuth";
import { fetchVaccines } from "./vaccine";
import { addApprovedRequestToInventory } from "./vaccineRequestToInventory";

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
 * Fetch vaccine requests - Filter by user role
 * @param {Object} options - Query options
 * @param {string} options.barangayId - Optional barangay ID to filter by
 * @param {boolean} options.isAdmin - If true, fetch all requests (for Head Nurse)
 * @param {string} options.userId - Current user ID (required for filtering)
 * @returns {Promise<{ data: Array, error: Object }>}
 */
export async function fetchVaccineRequests(options = {}) {
  console.log('fetchVaccineRequests called with options:', options);

  let query = supabase
    .from("vaccine_requests")
    .select("*")
    .order("created_at", { ascending: false });

  // If not admin (Health Worker), filter by requested_by
  if (!options.isAdmin && options.userId) {
    console.log('Health Worker: Filtering by requested_by:', options.userId);
    query = query.eq("requested_by", options.userId);
  } else if (!options.isAdmin) {
    console.log('Health Worker but no userId provided - returning empty');
    return { data: [], error: null };
  }

  if (options.barangayId) {
    query = query.eq("barangay_id", options.barangayId);
  }

  const { data, error } = await query;
  console.log('Query executed:', { hasData: !!data, hasError: !!error, dataLength: data?.length, error });
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
    // Get user ID from localStorage for Health Worker filtering
    let userId = null;
    if (!options.isAdmin) {
      const userData = localStorage.getItem('vaxsync_user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          userId = user.id;
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
    }

    // Fetch requests with userId for filtering
    const { data, error } = await fetchVaccineRequests({ ...options, userId });
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
 * @param {Object} request - The request data (vaccine_id, quantity_dose, quantity_vial, notes, barangay_id)
 * @returns {Promise<{ data: Object, error: Object }>}
 */
export async function createVaccineRequest(request) {
  console.log('Creating vaccine request');
  console.log('Request data:', request);

  // Use requested_by from request if provided, otherwise try profile_id, otherwise get from localStorage
  let requested_by = request.requested_by || request.profile_id;
  
  console.log('requested_by from request:', requested_by);
  
  if (!requested_by) {
    console.log('requested_by not in request, checking localStorage');
    const userData = localStorage.getItem('vaxsync_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        requested_by = user.id;
        console.log('Got requested_by from localStorage:', requested_by);
      } catch (e) {
        console.error('Failed to parse user data from localStorage:', e);
      }
    }
  }

  if (!requested_by) {
    console.error('User ID not found in request or localStorage');
    throw new Error('User not authenticated');
  }

  const requestData = {
    vaccine_id: request.vaccine_id,
    quantity_dose: request.quantity_dose,
    quantity_vial: request.quantity_vial || null,
    notes: request.notes || "",
    barangay_id: request.barangay_id,
    requested_by: requested_by,
    status: "pending",
  };

  console.log('Final request data to insert:', requestData);

  const { data, error } = await supabase
    .from("vaccine_requests")
    .insert([requestData]);

  if (error) {
    console.error('Supabase insert error:', error);
  } else {
    console.log('Vaccine request created successfully:', data);
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
 * When status is "approved", automatically adds vaccine to barangay inventory
 * @param {string} requestId - The request ID
 * @param {string} status - The new status (pending, approved, rejected, released)
 * @returns {Promise<{success: boolean, error: string|null, inventoryAdded: boolean}>}
 */
export const updateVaccineRequestStatus = async (requestId, status) => {
  try {
    console.log('Updating request status:', requestId, 'to', status);
    
    // If approving, get request details first
    let requestDetails = null;
    if (status === 'approved') {
      const { data, error: fetchError } = await supabase
        .from('vaccine_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (fetchError || !data) {
        console.error('Error fetching request details:', fetchError);
        throw new Error('Could not fetch request details');
      }
      requestDetails = data;
    }
    
    // Update status
    const { data, error } = await updateVaccineRequest(requestId, { status });
    console.log('Update result:', { data, error });
    if (error) {
      console.error('Supabase update error details:', error);
      throw error;
    }
    
    // If approved, automatically add to inventory
    let inventoryAdded = false;
    if (status === 'approved' && requestDetails) {
      console.log('Status is approved, adding to inventory...');
      const { success: inventorySuccess, error: inventoryError } = await addApprovedRequestToInventory(
        requestId,
        requestDetails.vaccine_id,
        requestDetails.barangay_id,
        requestDetails.quantity_vial || 0,
        requestDetails.quantity_dose || 0
      );
      
      if (inventorySuccess) {
        inventoryAdded = true;
        console.log('Successfully added to inventory');
      } else {
        console.warn('Failed to add to inventory:', inventoryError);
        // Don't fail the entire operation, just warn
      }
    }
    
    return { success: true, error: null, inventoryAdded };
  } catch (err) {
    console.error('Error updating request status:', err);
    return { success: false, error: err.message || 'Failed to update request status', inventoryAdded: false };
  }
};

/**
 * Update vaccine request fields (quantity and notes) with error handling
 * @param {string} requestId - The request ID
 * @param {Object} updates - Fields to update (quantity_dose, quantity_vial, notes)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateVaccineRequestData = async (requestId, updates) => {
  try {
    console.log('Updating request data:', requestId, updates);
    const { data, error } = await updateVaccineRequest(requestId, updates);
    console.log('Update result:', { data, error });
    if (error) {
      console.error('Supabase update error details:', error);
      throw error;
    }
    return { success: true, error: null };
  } catch (err) {
    console.error('Error updating request data:', err);
    return { success: false, error: err.message || 'Failed to update request' };
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
  updateVaccineRequestData,
  fetchVaccineRequests,
  createVaccineRequest,
  updateVaccineRequest,
  deleteVaccineRequest,
};
