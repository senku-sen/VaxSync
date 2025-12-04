// ============================================
// SESSION BENEFICIARIES FUNCTIONS
// ============================================
// Functions for managing residents in vaccination sessions
// Add, remove, track vaccination status
// ============================================

import { supabase } from "./supabase";

/**
 * Add residents to a vaccination session
 * @param {string} sessionId - Session ID
 * @param {Array} residentIds - Array of resident IDs to add
 * @returns {Promise<Object>} - { success: boolean, data: Array, error: string }
 */
export const addBeneficiariesToSession = async (sessionId, residentIds) => {
  try {
    console.log('Adding beneficiaries to session:', { sessionId, residentIds });

    if (!sessionId || !residentIds || residentIds.length === 0) {
      return {
        success: false,
        data: [],
        error: 'Session ID and resident IDs are required'
      };
    }

    // Prepare beneficiary records with default values as null (no decision yet)
    const beneficiaries = residentIds.map(residentId => ({
      session_id: sessionId,
      resident_id: residentId,
      attended: null,
      vaccinated: null
    }));

    // Insert beneficiaries
    const { data, error } = await supabase
      .from('session_beneficiaries')
      .insert(beneficiaries)
      .select('id, session_id, resident_id, attended, vaccinated, created_at');

    if (error) {
      console.error('Error adding beneficiaries:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to add beneficiaries'
      };
    }

    console.log('Beneficiaries added successfully:', data?.length || 0);
    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (err) {
    console.error('Unexpected error in addBeneficiariesToSession:', err);
    return {
      success: false,
      data: [],
      error: err.message || 'Unexpected error'
    };
  }
};

/**
 * Fetch beneficiaries for a session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} - { success: boolean, data: Array, error: string }
 */
export const fetchSessionBeneficiaries = async (sessionId) => {
  try {
    console.log('Fetching beneficiaries for session:', sessionId);

    // Fetch beneficiaries with resident data using a simpler approach
    const { data, error } = await supabase
      .from('session_beneficiaries')
      .select('id, session_id, resident_id, attended, vaccinated, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching beneficiaries:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch beneficiaries'
      };
    }

    // Fetch resident details for each beneficiary
    if (data && data.length > 0) {
      const residentIds = data.map(b => b.resident_id);
      const { data: residents, error: residentsError } = await supabase
        .from('residents')
        .select('id, name, contact, birthday, sex')
        .in('id', residentIds);

      if (residentsError) {
        console.warn('Warning fetching resident details:', residentsError);
        // Continue without resident details
      } else if (residents) {
        // Map resident data to beneficiaries
        const residentsMap = new Map(residents.map(r => [r.id, r]));
        data.forEach(b => {
          b.residents = residentsMap.get(b.resident_id) || null;
        });
      }
    }

    console.log('Beneficiaries fetched:', data?.length || 0);
    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (err) {
    console.error('Unexpected error in fetchSessionBeneficiaries:', err);
    return {
      success: false,
      data: [],
      error: err.message || 'Unexpected error'
    };
  }
};

/**
 * Update beneficiary vaccination status
 * @param {string} beneficiaryId - Beneficiary record ID
 * @param {Object} updateData - { attended, vaccinated, notes }
 * @returns {Promise<Object>} - { success: boolean, data: Object, error: string }
 */
export const updateBeneficiaryStatus = async (beneficiaryId, updateData) => {
  try {
    console.log('Updating beneficiary status:', { beneficiaryId, updateData });

    // Build update object with only provided fields
    const updateObject = { updated_at: new Date().toISOString() };
    
    if (updateData.attended !== undefined) {
      updateObject.attended = updateData.attended;
    }
    if (updateData.vaccinated !== undefined) {
      updateObject.vaccinated = updateData.vaccinated;
    }
    if (updateData.notes !== undefined) {
      updateObject.notes = updateData.notes;
    }

    const { data, error } = await supabase
      .from('session_beneficiaries')
      .update(updateObject)
      .eq('id', beneficiaryId)
      .select();

    if (error) {
      console.error('Error updating beneficiary:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update beneficiary'
      };
    }

    console.log('Beneficiary updated successfully:', data);
    return {
      success: true,
      data: data?.[0] || null,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error in updateBeneficiaryStatus:', err);
    return {
      success: false,
      data: null,
      error: err.message || 'Unexpected error'
    };
  }
};

/**
 * Update multiple beneficiaries at once
 * @param {Array} beneficiaries - Array of beneficiary objects with id, attended, vaccinated
 * @returns {Promise<Object>} - { success: boolean, data: Array, error: string }
 */
export const updateMultipleBeneficiaries = async (beneficiaries) => {
  try {
    console.log('Updating multiple beneficiaries:', beneficiaries.length);

    if (!beneficiaries || beneficiaries.length === 0) {
      return {
        success: true,
        data: [],
        error: null
      };
    }

    // Update each beneficiary
    const updatePromises = beneficiaries.map(b =>
      supabase
        .from('session_beneficiaries')
        .update({
          attended: b.attended || false,
          vaccinated: b.vaccinated || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', b.id)
    );

    const results = await Promise.all(updatePromises);

    // Check for errors
    const hasError = results.some(r => r.error);
    if (hasError) {
      const firstError = results.find(r => r.error)?.error;
      console.error('Error updating beneficiaries:', firstError);
      return {
        success: false,
        data: [],
        error: firstError?.message || 'Failed to update beneficiaries'
      };
    }

    console.log('All beneficiaries updated successfully');
    return {
      success: true,
      data: beneficiaries,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error in updateMultipleBeneficiaries:', err);
    return {
      success: false,
      data: [],
      error: err.message || 'Unexpected error'
    };
  }
};

/**
 * Remove a beneficiary from a session
 * @param {string} beneficiaryId - Beneficiary record ID
 * @returns {Promise<Object>} - { success: boolean, error: string }
 */
export const removeBeneficiaryFromSession = async (beneficiaryId) => {
  try {
    console.log('Removing beneficiary from session:', beneficiaryId);

    const { error } = await supabase
      .from('session_beneficiaries')
      .delete()
      .eq('id', beneficiaryId);

    if (error) {
      console.error('Error removing beneficiary:', error);
      return {
        success: false,
        error: error.message || 'Failed to remove beneficiary'
      };
    }

    console.log('Beneficiary removed successfully');
    return {
      success: true,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error in removeBeneficiaryFromSession:', err);
    return {
      success: false,
      error: err.message || 'Unexpected error'
    };
  }
};

/**
 * Get session statistics (total, attended, vaccinated)
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} - { success: boolean, data: Object, error: string }
 */
export const getSessionStatistics = async (sessionId) => {
  try {
    console.log('Fetching session statistics:', sessionId);

    const { data, error } = await supabase
      .from('session_beneficiaries')
      .select('id, attended, vaccinated')
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error fetching statistics:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch statistics'
      };
    }

    const total = data?.length || 0;
    const attended = data?.filter(b => b.attended === true).length || 0;
    const vaccinated = data?.filter(b => b.vaccinated === true).length || 0;
    const missed = data?.filter(b => b.vaccinated === false).length || 0;

    const stats = {
      total,
      attended,
      vaccinated,
      missed,
      notAttended: total - attended,
      attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 0,
      vaccinationRate: total > 0 ? Math.round((vaccinated / total) * 100) : 0
    };

    console.log('Session statistics:', stats);
    return {
      success: true,
      data: stats,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error in getSessionStatistics:', err);
    return {
      success: false,
      data: null,
      error: err.message || 'Unexpected error'
    };
  }
};

/**
 * Get residents available for a session (not yet added)
 * @param {string} sessionId - Session ID
 * @param {string} barangayName - Barangay name to filter residents
 * @returns {Promise<Object>} - { success: boolean, data: Array, error: string }
 */
export const getAvailableResidentsForSession = async (sessionId, barangayName) => {
  try {
    console.log('Fetching available residents for session:', { sessionId, barangayName });

    // Get all residents in the barangay
    let query = supabase
      .from('residents')
      .select('id, name, contact, birthday, sex, status')
      .eq('status', 'approved');

    if (barangayName) {
      query = query.eq('barangay', barangayName);
    }

    const { data: allResidents, error: residentsError } = await query;

    if (residentsError) {
      console.error('Error fetching residents:', residentsError);
      return {
        success: false,
        data: [],
        error: residentsError.message || 'Failed to fetch residents'
      };
    }

    // Get already added beneficiaries
    const { data: addedBeneficiaries, error: beneficiariesError } = await supabase
      .from('session_beneficiaries')
      .select('resident_id')
      .eq('session_id', sessionId);

    if (beneficiariesError) {
      console.error('Error fetching added beneficiaries:', beneficiariesError);
      return {
        success: false,
        data: [],
        error: beneficiariesError.message || 'Failed to fetch added beneficiaries'
      };
    }

    // Filter out already added residents
    const addedResidentIds = new Set(addedBeneficiaries?.map(b => b.resident_id) || []);
    const availableResidents = (allResidents || []).filter(
      resident => !addedResidentIds.has(resident.id)
    );

    console.log('Available residents:', availableResidents.length);
    return {
      success: true,
      data: availableResidents,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error in getAvailableResidentsForSession:', err);
    return {
      success: false,
      data: [],
      error: err.message || 'Unexpected error'
    };
  }
};

export default {
  addBeneficiariesToSession,
  fetchSessionBeneficiaries,
  updateBeneficiaryStatus,
  removeBeneficiaryFromSession,
  getSessionStatistics,
  getAvailableResidentsForSession
};
