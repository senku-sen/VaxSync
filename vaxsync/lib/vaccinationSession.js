// ============================================
// VACCINATION SESSION FUNCTIONS
// ============================================
// Functions for managing vaccination sessions
// Create, fetch, update, delete sessions
// ============================================

import { supabase } from "./supabase";

/**
 * Create a new vaccination session
 * @param {Object} sessionData - Session data to insert
 * @returns {Promise<Object>} - { success: boolean, data: Object, error: string }
 */
export const createVaccinationSession = async (sessionData) => {
  try {
    console.log('Creating vaccination session:', sessionData);

    const { data, error } = await supabase
      .from("vaccination_sessions")
      .insert({
        barangay_id: sessionData.barangay_id,
        vaccine_id: sessionData.vaccine_id,
        session_date: sessionData.session_date,
        session_time: sessionData.session_time,
        target: parseInt(sessionData.target, 10),
        administered: 0,
        status: "Scheduled",
        created_by: sessionData.created_by,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error creating session:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to create session'
      };
    }

    console.log('Session created successfully:', data);
    return {
      success: true,
      data: data?.[0] || null,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error in createVaccinationSession:', err);
    return {
      success: false,
      data: null,
      error: err.message || 'Unexpected error'
    };
  }
};

/**
 * Fetch all vaccination sessions for a user
 * @param {string} userId - User ID to fetch sessions for
 * @returns {Promise<Object>} - { success: boolean, data: Array, error: string }
 */
export const fetchVaccinationSessions = async (userId) => {
  try {
    console.log('Fetching vaccination sessions for user:', userId);

    const { data, error } = await supabase
      .from("vaccination_sessions")
      .select("*")
      .eq("created_by", userId)
      .order("session_date", { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch sessions'
      };
    }

    console.log('Sessions fetched:', data?.length || 0, data);

    // Fetch vaccine and barangay details separately
    if (data && data.length > 0) {
      const vaccineIds = [...new Set(data.map(s => s.vaccine_id))];
      const barangayIds = [...new Set(data.map(s => s.barangay_id))];

      const [vaccinesData, barangaysData] = await Promise.all([
        vaccineIds.length > 0 ? supabase.from("vaccines").select("id, name").in("id", vaccineIds) : { data: [] },
        barangayIds.length > 0 ? supabase.from("barangays").select("id, name, municipality").in("id", barangayIds) : { data: [] }
      ]);

      const vaccinesMap = {};
      const barangaysMap = {};

      if (vaccinesData.data) {
        vaccinesData.data.forEach(v => {
          vaccinesMap[v.id] = v;
        });
      }

      if (barangaysData.data) {
        barangaysData.data.forEach(b => {
          barangaysMap[b.id] = b;
        });
      }

      // Attach vaccine and barangay data to sessions
      const enrichedData = data.map(session => ({
        ...session,
        vaccines: vaccinesMap[session.vaccine_id] || null,
        barangays: barangaysMap[session.barangay_id] || null
      }));

      console.log('Enriched sessions:', enrichedData);
      return {
        success: true,
        data: enrichedData,
        error: null
      };
    }

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (err) {
    console.error('Unexpected error in fetchVaccinationSessions:', err);
    return {
      success: false,
      data: [],
      error: err.message || 'Unexpected error'
    };
  }
};

/**
 * Update vaccination session details
 * @param {string} sessionId - Session ID to update
 * @param {Object} updateData - Data to update (session_date, session_time, vaccine_id, target)
 * @returns {Promise<Object>} - { success: boolean, data: Object, error: string }
 */
export const updateVaccinationSession = async (sessionId, updateData) => {
  try {
    console.log('Updating vaccination session:', { sessionId, updateData });

    const { data, error } = await supabase
      .from("vaccination_sessions")
      .update({
        session_date: updateData.session_date,
        session_time: updateData.session_time,
        vaccine_id: updateData.vaccine_id,
        target: parseInt(updateData.target, 10),
        updated_at: new Date().toISOString()
      })
      .eq("id", sessionId)
      .select();

    if (error) {
      console.error('Error updating session:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update session'
      };
    }

    console.log('Session updated successfully');
    return {
      success: true,
      data: data?.[0] || null,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error in updateVaccinationSession:', err);
    return {
      success: false,
      data: null,
      error: err.message || 'Unexpected error'
    };
  }
};

/**
 * Update vaccination session administered count
 * @param {string} sessionId - Session ID to update
 * @param {number} administered - Number of people administered
 * @returns {Promise<Object>} - { success: boolean, data: Object, error: string }
 */
export const updateSessionAdministered = async (sessionId, administered) => {
  try {
    console.log('Updating session administered count:', { sessionId, administered });

    const { data, error } = await supabase
      .from("vaccination_sessions")
      .update({
        administered: parseInt(administered, 10),
        updated_at: new Date().toISOString()
      })
      .eq("id", sessionId)
      .select();

    if (error) {
      console.error('Error updating session:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update session'
      };
    }

    console.log('Session updated successfully');
    return {
      success: true,
      data: data?.[0] || null,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error in updateSessionAdministered:', err);
    return {
      success: false,
      data: null,
      error: err.message || 'Unexpected error'
    };
  }
};

/**
 * Delete a vaccination session
 * @param {string} sessionId - Session ID to delete
 * @returns {Promise<Object>} - { success: boolean, error: string }
 */
export const deleteVaccinationSession = async (sessionId) => {
  try {
    console.log('Deleting vaccination session:', sessionId);

    const { error } = await supabase
      .from("vaccination_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      console.error('Error deleting session:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete session'
      };
    }

    console.log('Session deleted successfully');
    return {
      success: true,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error in deleteVaccinationSession:', err);
    return {
      success: false,
      error: err.message || 'Unexpected error'
    };
  }
};

/**
 * Fetch all vaccines for dropdown
 * @returns {Promise<Object>} - { success: boolean, data: Array, error: string }
 */
export const fetchVaccinesForSession = async () => {
  try {
    console.log('Fetching vaccines for session...');

    const { data, error } = await supabase
      .from("vaccines")
      .select("id, name")
      .order("name");

    if (error) {
      console.error('Error fetching vaccines:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to load vaccines'
      };
    }

    console.log('Vaccines loaded:', data?.length || 0);
    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (err) {
    console.error('Unexpected error in fetchVaccinesForSession:', err);
    return {
      success: false,
      data: [],
      error: err.message || 'Unexpected error'
    };
  }
};

/**
 * Get vaccine name by ID
 * @param {string} vaccineId - Vaccine ID
 * @param {Array} vaccines - List of vaccines
 * @returns {string} - Vaccine name or "Unknown"
 */
export const getVaccineName = (vaccineId, vaccines) => {
  if (!vaccineId || !vaccines) return "Unknown";
  const vaccine = vaccines.find(v => v.id === vaccineId);
  return vaccine?.name || "Unknown";
};

/**
 * Get status badge color class
 * @param {string} status - Session status
 * @returns {string} - Tailwind class for badge color
 */
export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-800';
    case 'In progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'Scheduled':
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

/**
 * Calculate progress percentage
 * @param {number} administered - Number administered
 * @param {number} target - Target number
 * @returns {number} - Progress percentage (0-100)
 */
export const calculateProgress = (administered, target) => {
  if (!target || target === 0) return 0;
  return Math.round((administered / target) * 100);
};

/**
 * Format session date and time
 * @param {string} date - Session date (YYYY-MM-DD)
 * @param {string} time - Session time (HH:MM)
 * @returns {string} - Formatted date and time
 */
export const formatSessionDateTime = (date, time) => {
  if (!date || !time) return "N/A";
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  return `${formattedDate} ${time}`;
};
