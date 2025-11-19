import { supabase } from "./supabase";
import { getVaccineById } from "./vaccine";
import { getBarangayVaccineTotal } from "./barangayVaccineInventory";

/**
 * Check if a vaccine has approved requests in the system
 * @param {string} vaccineId - The vaccine ID to check
 * @param {string} barangayId - Optional: filter by barangay
 * @returns {Promise<{hasApproved: boolean, count: number, error: Object|null}>}
 */
export async function checkApprovedVaccineRequests(vaccineId, barangayId = null) {
  try {
    console.log('Checking approved vaccine requests for:', vaccineId, barangayId);

    let query = supabase
      .from('vaccine_requests')
      .select('id', { count: 'exact' })
      .eq('vaccine_id', vaccineId)
      .eq('status', 'approved');

    if (barangayId) {
      query = query.eq('barangay_id', barangayId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error checking approved requests:', error);
      return { hasApproved: false, count: 0, error };
    }

    console.log('Approved requests found:', count);
    return { hasApproved: count > 0, count: count || 0, error: null };
  } catch (err) {
    console.error('Error in checkApprovedVaccineRequests:', err);
    return { hasApproved: false, count: 0, error: err };
  }
}

/**
 * Get max quantity_vial from approved vaccine requests
 * @param {string} vaccineId - The vaccine ID
 * @param {string} barangayId - Optional: filter by barangay
 * @returns {Promise<{maxQuantity: number, error: Object|null}>}
 */
export async function getMaxApprovedVaccineQuantity(vaccineId, barangayId = null) {
  try {
    console.log('Getting max approved vaccine quantity for:', vaccineId);

    let query = supabase
      .from('vaccine_requests')
      .select('quantity_vial')
      .eq('vaccine_id', vaccineId)
      .eq('status', 'approved');

    if (barangayId) {
      query = query.eq('barangay_id', barangayId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching max quantity:', error);
      return { maxQuantity: 0, error };
    }

    if (!data || data.length === 0) {
      return { maxQuantity: 0, error: null };
    }

    const maxQuantity = Math.max(...data.map(req => req.quantity_vial || 0));
    console.log('Max approved quantity:', maxQuantity);
    return { maxQuantity, error: null };
  } catch (err) {
    console.error('Error in getMaxApprovedVaccineQuantity:', err);
    return { maxQuantity: 0, error: err };
  }
}

/**
 * Validate vaccine before adding to request
 * Checks:
 * 1. Vaccine ID exists and is valid
 * 2. Vaccine is not expired
 * @param {string} vaccineId - The vaccine ID to validate
 * @returns {Promise<{isValid: boolean, vaccine: Object|null, errors: Array}>}
 */
export async function validateVaccineForRequest(vaccineId) {
  try {
    console.log('Validating vaccine for request:', vaccineId);
    const errors = [];

    // Check if vaccine ID is provided
    if (!vaccineId) {
      errors.push('Vaccine ID is required');
      return { isValid: false, vaccine: null, errors };
    }

    // Fetch vaccine details
    const { data: vaccine, error: vaccineError } = await getVaccineById(vaccineId);

    if (vaccineError || !vaccine) {
      errors.push('Vaccine not found in database');
      return { isValid: false, vaccine: null, errors };
    }

    console.log('Vaccine found:', vaccine.name);

    // Check if vaccine is expired
    if (vaccine.expiry_date) {
      const expiryDate = new Date(vaccine.expiry_date);
      const today = new Date();
      if (expiryDate < today) {
        errors.push(`Vaccine expired on ${expiryDate.toLocaleDateString()}`);
      }
    }

    const isValid = errors.length === 0;
    console.log('Vaccine validation result:', { isValid, errors });

    return { isValid, vaccine, errors };
  } catch (err) {
    console.error('Error in validateVaccineForRequest:', err);
    return { isValid: false, vaccine: null, errors: [err.message] };
  }
}

/**
 * Validate vaccine for scheduling (checks inventory availability)
 * Checks:
 * 1. Vaccine ID exists and is valid
 * 2. Vaccine is not expired
 * 3. Vaccine has inventory in the barangay
 * @param {string} vaccineId - The vaccine ID to validate
 * @param {string} barangayId - The barangay ID (required for inventory check)
 * @returns {Promise<{isValid: boolean, vaccine: Object|null, availableQuantity: number, errors: Array}>}
 */
export async function validateVaccineForSchedule(vaccineId, barangayId) {
  try {
    console.log('Validating vaccine for schedule:', { vaccineId, barangayId });
    const errors = [];
    let availableQuantity = 0;

    // Check if vaccine ID is provided
    if (!vaccineId) {
      errors.push('Vaccine ID is required');
      return { isValid: false, vaccine: null, availableQuantity: 0, errors };
    }

    // Check if barangay ID is provided
    if (!barangayId) {
      errors.push('Barangay ID is required');
      return { isValid: false, vaccine: null, availableQuantity: 0, errors };
    }

    // Fetch vaccine details
    const { data: vaccine, error: vaccineError } = await getVaccineById(vaccineId);

    if (vaccineError || !vaccine) {
      errors.push('Vaccine not found in database');
      return { isValid: false, vaccine: null, availableQuantity: 0, errors };
    }

    console.log('Vaccine found:', vaccine.name);

    // Check if vaccine is expired
    if (vaccine.expiry_date) {
      const expiryDate = new Date(vaccine.expiry_date);
      const today = new Date();
      if (expiryDate < today) {
        errors.push(`Vaccine expired on ${expiryDate.toLocaleDateString()}`);
      }
    }

    // Check if vaccine has inventory in barangay
    const { total: inventoryTotal, error: inventoryError } = await getBarangayVaccineTotal(barangayId, vaccineId);

    if (inventoryError) {
      errors.push('Could not check inventory availability');
    }

    if (!inventoryTotal || inventoryTotal === 0) {
      errors.push('No vaccine inventory available in this barangay');
    } else {
      availableQuantity = inventoryTotal;
    }

    const isValid = errors.length === 0;
    console.log('Vaccine schedule validation result:', { isValid, availableQuantity, errors });

    return { isValid, vaccine, availableQuantity, errors };
  } catch (err) {
    console.error('Error in validateVaccineForSchedule:', err);
    return { isValid: false, vaccine: null, availableQuantity: 0, errors: [err.message] };
  }
}

/**
 * Get vaccine request details with validation
 * @param {string} vaccineId - The vaccine ID
 * @param {string} barangayId - The barangay ID
 * @returns {Promise<{request: Object|null, maxQuantity: number, error: Object|null}>}
 */
export async function getApprovedVaccineRequestDetails(vaccineId, barangayId) {
  try {
    console.log('Getting approved vaccine request details:', { vaccineId, barangayId });

    // Get the approved request for this vaccine and barangay
    const { data, error } = await supabase
      .from('vaccine_requests')
      .select('*')
      .eq('vaccine_id', vaccineId)
      .eq('barangay_id', barangayId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching request details:', error);
      return { request: null, maxQuantity: 0, error };
    }

    if (!data || data.length === 0) {
      return { request: null, maxQuantity: 0, error: null };
    }

    const request = data[0];
    const maxQuantity = request.quantity_vial || 0;

    console.log('Approved request found:', { id: request.id, maxQuantity });
    return { request, maxQuantity, error: null };
  } catch (err) {
    console.error('Error in getApprovedVaccineRequestDetails:', err);
    return { request: null, maxQuantity: 0, error: err };
  }
}

export default {
  checkApprovedVaccineRequests,
  getMaxApprovedVaccineQuantity,
  validateVaccineForRequest,
  validateVaccineForSchedule,
  getApprovedVaccineRequestDetails
};
