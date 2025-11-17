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
      .select(`
        *,
        vaccines:vaccine_id (id, name),
        barangays:barangay_id (id, name, municipality)
      `)
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

    console.log('Sessions fetched:', data?.length || 0);
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
