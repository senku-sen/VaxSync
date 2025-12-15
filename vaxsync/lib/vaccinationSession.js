// ============================================
// VACCINATION SESSION FUNCTIONS
// ============================================
// Functions for managing vaccination sessions
// Create, fetch, update, delete sessions
// ============================================

import { supabase } from "./supabase";
import { deductBarangayVaccineInventory } from "./BarangayVaccineInventory";
import { getDosesPerVial } from "./VaccineVialMapping";
import { createInventoryChangeNotification } from "./notification";

/**
 * Create a new vaccination session
 * @param {Object} sessionData - Session data to insert
 *   - barangay_id: Barangay ID
 *   - vaccine_id: Vaccine ID (will be converted to barangay_vaccine_inventory ID)
 *   - session_date: Session date
 *   - session_time: Session time
 *   - target: Target number of people
 *   - created_by: User ID who created the session
 * @returns {Promise<Object>} - { success: boolean, data: Object, error: string }
 */
export const createVaccinationSession = async (sessionData) => {
  try {
    console.log('Creating vaccination session:', sessionData);

    // sessionData.vaccine_id is vaccines.id
    // We need to find vaccine_doses for this vaccine, then find barangay_vaccine_inventory
    // that references those vaccine_doses
    
    // Step 1: Find vaccine_doses for this vaccine and get vaccine name
    // First get the vaccine name to look up doses per vial
    const { data: vaccineInfo, error: vaccineInfoError } = await supabase
      .from('Vaccines')
      .select('id, name')
      .eq('id', sessionData.vaccine_id)
      .single();

    if (vaccineInfoError || !vaccineInfo) {
      console.error('Error fetching vaccine info:', vaccineInfoError);
      return {
        success: false,
        data: null,
        error: `Vaccine not found: ${vaccineInfoError?.message || 'Unknown error'}`
      };
    }

    const vaccineName = vaccineInfo.name;
    const dosesPerVial = getDosesPerVial(vaccineName) || 10; // Default to 10 if not found

    // Now find vaccine_doses for this vaccine
    const { data: vaccineDoses, error: dosesError } = await supabase
      .from('VaccineDoses')
      .select('id, vaccine_id')
      .eq('vaccine_id', sessionData.vaccine_id);

    if (dosesError) {
      console.error('Error fetching vaccine_doses:', dosesError);
      return {
        success: false,
        data: null,
        error: `Database error: ${dosesError.message || 'Failed to fetch vaccine doses'}`
      };
    }

    if (!vaccineDoses || vaccineDoses.length === 0) {
      console.error('No vaccine_doses found for vaccine:', sessionData.vaccine_id);
      return {
        success: false,
        data: null,
        error: 'No vaccine doses found for this vaccine. Please ensure the vaccine is properly configured in the system.'
      };
    }

    // Step 2: Find barangay_vaccine_inventory for any of these vaccine_doses
    const vaccineDoseIds = vaccineDoses.map(d => d.id);
    const { data: inventoryData, error: inventoryError } = await supabase
      .from("BarangayVaccineInventory")
      .select("id, vaccine_id")
      .eq("barangay_id", sessionData.barangay_id)
      .in("vaccine_id", vaccineDoseIds)
      .single();

    if (inventoryError) {
      console.error('Error finding barangay vaccine inventory:', inventoryError);
      if (inventoryError.code === 'PGRST116') {
        // No rows returned
        return {
          success: false,
          data: null,
          error: 'Vaccine not available in this barangay inventory. Please add this vaccine to the barangay inventory first through the Inventory Management page.'
        };
      }
      return {
        success: false,
        data: null,
        error: `Database error: ${inventoryError.message || 'Failed to find inventory'}`
      };
    }

    if (!inventoryData) {
      return {
        success: false,
        data: null,
        error: 'Vaccine not available in this barangay inventory. Please add this vaccine to the barangay inventory first through the Inventory Management page.'
      };
    }

    // Verify the vaccine_dose exists (inventoryData.vaccine_id is a vaccine_dose ID)
    const vaccineDoseInfo = vaccineDoses.find(d => d.id === inventoryData.vaccine_id);

    if (!vaccineDoseInfo) {
      console.error('Vaccine dose not found for inventory vaccine_id:', inventoryData.vaccine_id);
      return {
        success: false,
        data: null,
        error: 'Vaccine dose configuration not found. Please ensure the vaccine is properly configured.'
      };
    }

    // dosesPerVial is already calculated from vaccine name above
    // actualVaccineId is the original vaccine_id from vaccines table
    const actualVaccineId = sessionData.vaccine_id;

    const dosesPerPerson = sessionData.doses_per_person || 1;
    const target = parseInt(sessionData.target, 10);
    
    // Calculate total doses needed and convert to vials
    const totalDosesNeeded = target * dosesPerPerson;
    const vialsNeeded = Math.ceil(totalDosesNeeded / dosesPerVial);

    console.log('Calculating vials needed:', {
      target,
      dosesPerPerson,
      dosesPerVial,
      totalDosesNeeded,
      vialsNeeded,
      vaccineDoseId: inventoryData.vaccine_id,
      actualVaccineId: actualVaccineId,
      vaccineId: sessionData.vaccine_id
    });

    // Deduct inventory BEFORE creating session
    // Use API route to ensure server-side execution with admin client
    let deductResult;
    try {
      const response = await fetch('/api/inventory/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barangayId: sessionData.barangay_id,
          vaccineId: actualVaccineId, // Use the actual vaccine_id from vaccines table
          quantityToDeduct: vialsNeeded
        })
      });

      const apiResult = await response.json();
      deductResult = {
        success: apiResult.success,
        error: apiResult.error,
        deductedRecords: apiResult.deductedRecords || []
      };
      
      console.log('✅ API deduction result:', deductResult);
    } catch (apiError) {
      console.error('❌ Error calling deduction API:', apiError);
      console.error('   Falling back to direct deduction...');
      // Fallback to direct call (may fail due to RLS)
      deductResult = await deductBarangayVaccineInventory(
        sessionData.barangay_id,
        actualVaccineId,
        vialsNeeded
      );
    }

    if (!deductResult.success) {
      console.error('❌ Failed to deduct inventory:', deductResult.error);
      console.error('   Deduction result:', JSON.stringify(deductResult, null, 2));
      return {
        success: false,
        data: null,
        error: `Insufficient inventory: ${deductResult.error?.message || deductResult.error || 'Not enough vials available'}`
      };
    }

    console.log('✅ Inventory deducted successfully:', vialsNeeded, 'vials');
    console.log('   Deducted records:', deductResult.deductedRecords);

    // Get barangay name for notification
    const { data: barangayData } = await supabase
      .from('barangays')
      .select('name')
      .eq('id', sessionData.barangay_id)
      .single();

    const barangayName = barangayData?.name || 'Unknown Barangay';
    const dosesDeducted = vialsNeeded * dosesPerVial;

    // Create notification for inventory change
    await createInventoryChangeNotification(
      vaccineName,
      barangayName,
      vialsNeeded,
      dosesDeducted,
      'deducted'
    );

    // Dispatch custom event to notify inventory change
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('inventoryUpdated', {
          detail: {
            barangayId: sessionData.barangay_id,
            vaccineId: actualVaccineId,
            vialsDeducted: vialsNeeded,
            dosesDeducted: dosesDeducted,
            deductedRecords: deductResult.deductedRecords
          }
        }));
      }, 0);
    }

    // Now create the session with the barangay_vaccine_inventory ID
    const { data, error } = await supabase
      .from("VaccinationSessions")
      .insert({
        barangay_id: sessionData.barangay_id,
        vaccine_id: inventoryData.id,  // Use barangay_vaccine_inventory ID
        session_date: sessionData.session_date,
        session_time: sessionData.session_time,
        target: target,
        administered: 0,
        status: "Scheduled",
        created_by: sessionData.created_by,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error creating session:', error);
      // If session creation fails, try to add back the inventory
      // (This is a rollback - in production you might want more robust transaction handling)
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
      .from("VaccinationSessions")
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
      // session.vaccine_id references barangay_vaccine_inventory.id
      // We need to fetch vaccine_doses and vaccines through that relationship
      const inventoryIds = [...new Set(data.map(s => s.vaccine_id))];
      const barangayIds = [...new Set(data.map(s => s.barangay_id))];

      // Fetch barangay_vaccine_inventory with nested vaccine_doses and vaccines
      const { data: inventoryData } = inventoryIds.length > 0 
        ? await supabase
            .from("BarangayVaccineInventory")
            .select("id, VaccineDoses(vaccine_id, Vaccines(id, name))")
            .in("id", inventoryIds)
        : { data: [] };

      const [barangaysData] = await Promise.all([
        barangayIds.length > 0 ? supabase.from("Barangays").select("id, name, municipality").in("id", barangayIds) : { data: [] }
      ]);

      const vaccinesMap = {};
      const barangaysMap = {};

      // Build vaccines map from inventory data
      if (inventoryData) {
        inventoryData.forEach(inv => {
          if (inv.vaccine_doses && inv.vaccine_doses.vaccines) {
            vaccinesMap[inv.id] = inv.vaccine_doses.vaccines;
          }
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
 * Fetch all vaccination sessions (for Head Nurse/Admin)
 * @returns {Promise<Object>} - { success: boolean, data: Array, error: string }
 */
export const fetchAllVaccinationSessions = async () => {
  try {
    console.log('Fetching all vaccination sessions');

    const { data, error } = await supabase
      .from("VaccinationSessions")
      .select("*")
      .order("session_date", { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch sessions'
      };
    }

    console.log('All sessions fetched:', data?.length || 0, data);

    // Fetch vaccine and barangay details separately
    if (data && data.length > 0) {
      // session.vaccine_id references barangay_vaccine_inventory.id
      // We need to fetch vaccine_doses and vaccines through that relationship
      const inventoryIds = [...new Set(data.map(s => s.vaccine_id))];
      const barangayIds = [...new Set(data.map(s => s.barangay_id))];

      // Fetch barangay_vaccine_inventory with nested vaccine_doses and vaccines
      const { data: inventoryData } = inventoryIds.length > 0 
        ? await supabase
            .from("BarangayVaccineInventory")
            .select("id, VaccineDoses(vaccine_id, Vaccines(id, name))")
            .in("id", inventoryIds)
        : { data: [] };

      const [barangaysData] = await Promise.all([
        barangayIds.length > 0 ? supabase.from("Barangays").select("id, name, municipality").in("id", barangayIds) : { data: [] }
      ]);

      const vaccinesMap = {};
      const barangaysMap = {};

      // Build vaccines map from inventory data
      if (inventoryData) {
        inventoryData.forEach(inv => {
          if (inv.vaccine_doses && inv.vaccine_doses.vaccines) {
            vaccinesMap[inv.id] = inv.vaccine_doses.vaccines;
          }
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
    console.error('Unexpected error in fetchAllVaccinationSessions:', err);
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
      .from("VaccinationSessions")
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
 * Update vaccination session administered count and status
 * @param {string} sessionId - Session ID to update
 * @param {number} administered - Number of people administered
 * @param {string} status - Session status (Scheduled, In progress, Completed)
 * @returns {Promise<Object>} - { success: boolean, data: Object, error: string }
 */
export const updateSessionAdministered = async (sessionId, administered, status = null) => {
  try {
    console.log('Updating session administered count:', { sessionId, administered, status });

    const updateData = {
      administered: parseInt(administered, 10),
      updated_at: new Date().toISOString()
    };

    // Add status if provided
    if (status) {
      updateData.status = status;
    }

    const { data, error } = await supabase
      .from("VaccinationSessions")
      .update(updateData)
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
 * Update session status only
 * @param {string} sessionId - Session ID to update
 * @param {string} status - New status (Scheduled, In progress, Completed)
 * @returns {Promise<Object>} - { success: boolean, data: Object, error: string }
 */
export const updateSessionStatus = async (sessionId, status) => {
  try {
    console.log('Updating session status:', { sessionId, status });

    // Fetch session to get current data BEFORE updating
    const { data: session, error: fetchError } = await supabase
      .from("VaccinationSessions")
      .select('id, vaccine_id, barangay_id, target, administered, status')
      .eq("id", sessionId)
      .single();

    if (fetchError || !session) {
      console.error('Error fetching session:', fetchError);
      return {
        success: false,
        data: null,
        error: 'Session not found'
      };
    }

    // Store the OLD status BEFORE updating
    const oldStatus = session.status;
    console.log('📊 OLD session status:', oldStatus);
    console.log('📊 NEW session status:', status);

    // Check if we should process inventory BEFORE updating
    const shouldProcessInventory = (status === 'Completed' || status === 'Cancelled') && oldStatus !== status;
    console.log('📊 Should process inventory restoration:', shouldProcessInventory);

    const { data, error } = await supabase
      .from("VaccinationSessions")
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq("id", sessionId)
      .select();

    if (error) {
      console.error('Error updating session status:', error);
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update session status'
      };
    }

    console.log('Session status updated successfully');

    // If session is being completed or cancelled, release reserved vials and add back unused doses
    if (shouldProcessInventory) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🟢 PROCESSING INVENTORY RESTORATION FOR', status.toUpperCase(), 'SESSION');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📊 Session Details:', {
        sessionId: session.id,
        barangayId: session.barangay_id,
        oldStatus: session.status,
        newStatus: status,
        target: session.target,
        administered: session.administered || 0
      });
      console.log('🟢 Processing inventory for', status, 'session...');
      
      const { releaseBarangayVaccineReservation, addBackBarangayVaccineInventory, addMainVaccineInventory } = await import('./barangayVaccineInventory.js');
      const { getDosesPerVial } = await import('./vaccineVialMapping.js');
      
      // Calculate unused vials (target - administered)
      const unusedVials = session.target - (session.administered || 0);
      
      console.log(`📊 Session stats: Target=${session.target}, Administered=${session.administered || 0}, Unused Vials=${unusedVials}`);
      
      // Resolve vaccine_id chain: session.vaccine_id is barangay_vaccine_inventory.id
      // We need to get the actual vaccines.id
      console.log('📊 Resolving vaccine_id chain from barangay_vaccine_inventory.id:', session.vaccine_id);
      
      const { data: inventoryRecord, error: inventoryError } = await supabase
        .from('barangay_vaccine_inventory')
        .select('vaccine_id')
        .eq('id', session.vaccine_id)
        .single();
      
      if (inventoryError || !inventoryRecord) {
        console.warn('⚠️ Warning: Could not find barangay_vaccine_inventory record:', inventoryError?.message);
        return {
          success: false,
          data: data?.[0] || null,
          error: 'Could not find vaccine inventory record'
        };
      }
      
      const vaccineDoseId = inventoryRecord.vaccine_id;
      console.log('  → vaccine_doses.id:', vaccineDoseId);
      
      // Now get the actual vaccines.id from vaccine_doses
      const { data: doseRecord, error: doseError } = await supabase
        .from('VaccineDoses')
        .select('vaccine_id')
        .eq('id', vaccineDoseId)
        .single();
      
      if (doseError || !doseRecord) {
        console.warn('⚠️ Warning: Could not find vaccine_doses record:', doseError?.message);
        return {
          success: false,
          data: data?.[0] || null,
          error: 'Could not find vaccine_doses record'
        };
      }
      
      const actualVaccineId = doseRecord.vaccine_id;
      console.log('  → vaccines.id:', actualVaccineId);
      
      // Get vaccine name to determine doses per vial
      const { data: vaccineData, error: vaccineError } = await supabase
        .from('Vaccines')
        .select('name')
        .eq('id', actualVaccineId)
        .single();
      
      if (vaccineError || !vaccineData) {
        console.warn('⚠️ Warning: Could not fetch vaccine name:', vaccineError?.message);
      }
      
      const vaccineName = vaccineData?.name || '';
      const dosesPerVial = getDosesPerVial(vaccineName) || 1;
      
      // Convert unused vials to actual doses
      const unusedDoses = unusedVials * dosesPerVial;
      
      console.log(`📊 Vaccine: ${vaccineName}, Doses per vial: ${dosesPerVial}`);
      console.log(`📊 Unused vials: ${unusedVials}, Unused doses: ${unusedDoses}`);
      
      // Add back unused doses to barangay inventory
      if (unusedVials > 0) {
        console.log('🟢 Adding back unused vials to barangay inventory:', {
          vials: unusedVials,
          doses: unusedDoses,
          barangayId: session.barangay_id,
          vaccineDoseId: vaccineDoseId,
          vaccineName: vaccineName
        });
        
        const addBackResult = await addBackBarangayVaccineInventory(
          session.barangay_id,
          vaccineDoseId,  // Pass vaccine_doses.id, not barangay_vaccine_inventory.id
          unusedVials  // Pass vials, not doses
        );

        if (addBackResult.success) {
          console.log('✅ Unused vials added back to barangay inventory');
          console.log('📊 BARANGAY VACCINE INVENTORY UPDATED:', {
            barangayId: session.barangay_id,
            vaccine: vaccineName,
            unusedVials: unusedVials,
            unusedDoses: unusedDoses,
            updatedRecords: addBackResult.addedRecords,
            timestamp: new Date().toISOString()
          });
        } else {
          console.warn('⚠️ Warning: Failed to add back unused vials to barangay inventory:', addBackResult.error);
        }
        
        // Note: Only updating barangay inventory, not main vaccine inventory
      } else {
        console.log('ℹ️ No unused vials to restore (all doses were administered)');
      }
      
      // Release reserved vials
      console.log('🟢 Releasing reserved vaccine vials...');
      const releaseResult = await releaseBarangayVaccineReservation(
        session.barangay_id,
        session.vaccine_id,  // ✅ FIXED: Pass barangay_vaccine_inventory.id (not vaccine_doses.id)
        unusedVials  // Pass vials, not doses
      );

      if (releaseResult.success) {
        console.log('✅ Reserved vaccine vials released');
      } else {
        console.warn('⚠️ Warning: Failed to release reserved vials:', releaseResult.error);
      }
    }

    // Only return session data if there are unused vials/doses
    // If all doses were administered (no remaining), don't return the data
    const hasRemaining = session.target > (session.administered || 0);
    
    return {
      success: true,
      data: hasRemaining ? (data?.[0] || null) : null,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error in updateSessionStatus:', err);
    return {
      success: false,
      data: null,
      error: err.message || 'Unexpected error'
    };
  }
};

/**
 * Delete a vaccination session and restore inventory
 * @param {string} sessionId - Session ID to delete
 * @returns {Promise<Object>} - { success: boolean, error: string }
 */
export const deleteVaccinationSession = async (sessionId) => {
  try {
    console.log('Deleting vaccination session:', sessionId);

    // First, fetch the session to get vaccine and administered info
    const { data: session, error: fetchError } = await supabase
      .from("VaccinationSessions")
      .select('id, vaccine_id, barangay_id, target, administered')
      .eq("id", sessionId)
      .single();

    if (fetchError || !session) {
      console.error('Error fetching session:', fetchError);
      return {
        success: false,
        error: 'Session not found'
      };
    }

    console.log('Session found:', session);
    console.log('📊 Session status:', session.status);

    // Reset resident vaccine data before deleting session
    console.log('🔄 Resetting resident vaccine data for session...');
    const { resetSessionResidentVaccineData } = await import('./sessionBeneficiaries.js');
    const resetResult = await resetSessionResidentVaccineData(sessionId);
    
    if (resetResult.success) {
      console.log('✅ Resident vaccine data reset successfully');
    } else {
      console.warn('⚠️ Warning: Failed to reset resident vaccine data:', resetResult.error);
    }

    // Delete the session
    const { error: deleteError } = await supabase
      .from("VaccinationSessions")
      .delete()
      .eq("id", sessionId);

    if (deleteError) {
      console.error('Error deleting session:', deleteError);
      return {
        success: false,
        error: deleteError.message || 'Failed to delete session'
      };
    }

    console.log('✅ Session deleted successfully');

    // Determine how many vials to restore based on administered count
    // If some were administered: restore only administered count
    // If none were administered: restore all target vials
    const totalVialsToRestore = (session.administered || 0) > 0 
      ? session.administered  // Restore what was administered
      : session.target;       // Restore all target if nothing was administered
    
    console.log(`📊 Session was ${session.status}. Administered=${session.administered || 0}. Restoring ${totalVialsToRestore} vials out of ${session.target} target`);

    // Resolve the vaccine ID chain:
    // session.vaccine_id → barangay_vaccine_inventory.id
    // barangay_vaccine_inventory.vaccine_id → vaccine_doses.id
    // vaccine_doses.vaccine_id → vaccines.id
    console.log('🔍 Resolving vaccine ID chain from barangay_vaccine_inventory.id:', session.vaccine_id);
    
    const { data: inventoryRecord, error: inventoryError } = await supabase
      .from('barangay_vaccine_inventory')
      .select('vaccine_id')
      .eq('id', session.vaccine_id);
    
    if (inventoryError || !inventoryRecord || inventoryRecord.length === 0) {
      console.warn('⚠️ Warning: Could not find barangay_vaccine_inventory record:', inventoryError?.message);
      // Continue anyway - inventory may have been deleted
    } else {
      const vaccineDoseId = inventoryRecord[0].vaccine_id;
      console.log('  → vaccine_doses.id:', vaccineDoseId);
      
      // Now get the actual vaccines.id from vaccine_doses
      const { data: doseRecord, error: doseError } = await supabase
        .from('VaccineDoses')
        .select('vaccine_id')
        .eq('id', vaccineDoseId);
      
      if (doseError || !doseRecord || doseRecord.length === 0) {
        console.warn('⚠️ Warning: Could not find vaccine_doses record:', doseError?.message);
        // Continue anyway - vaccine_doses may have been deleted
      } else {
        const actualVaccineId = doseRecord[0].vaccine_id;
        console.log('  → vaccines.id:', actualVaccineId);

        const unusedVials = session.target - (session.administered || 0);
        
        console.log(`📊 Session stats: Target=${session.target}, Administered=${session.administered || 0}, Unused Vials=${unusedVials}`);
        
        // Get vaccine name to determine doses per vial
        const { data: vaccineData, error: vaccineError } = await supabase
          .from('Vaccines')
          .select('name')
          .eq('id', actualVaccineId)
          .single();
        
        if (vaccineError || !vaccineData) {
          console.warn('⚠️ Warning: Could not fetch vaccine name:', vaccineError?.message);
        }
        
        const vaccineName = vaccineData?.name || '';
        const { getDosesPerVial } = await import('./vaccineVialMapping.js');
        const dosesPerVial = getDosesPerVial(vaccineName) || 1;
        
        // Convert vials to doses
        const totalDosesToRestore = totalVialsToRestore * dosesPerVial;
        const unusedDoses = unusedVials * dosesPerVial;
        
        console.log(`📊 Vaccine: ${vaccineName}, Doses per vial: ${dosesPerVial}`);
        console.log(`📊 Total vials to restore: ${totalVialsToRestore}, Total doses: ${totalDosesToRestore}`);
        console.log('🟢 Restoring ALL vials to inventory:', totalVialsToRestore);
        
        // Import functions dynamically to avoid circular dependencies
        const { addBackBarangayVaccineInventory, addMainVaccineInventory, releaseBarangayVaccineReservation } = await import('./barangayVaccineInventory.js');
        
        // Add back to barangay inventory (using vaccine_doses.id)
        const addBackResult = await addBackBarangayVaccineInventory(
          session.barangay_id,
          vaccineDoseId,  // ✅ FIXED: Pass vaccine_doses.id, not vaccines.id
          totalVialsToRestore  // Pass vials, not doses
        );

        if (addBackResult.success) {
          console.log('✅ Barangay inventory restored with', totalVialsToRestore, 'vials (', totalDosesToRestore, 'doses)');
        } else {
          console.warn('⚠️ Warning: Failed to restore barangay inventory:', addBackResult.error);
        }

        // Add back to main vaccine inventory (using vaccines.id) - in doses
        const mainAddBackResult = await addMainVaccineInventory(
          actualVaccineId,
          totalDosesToRestore  // Pass doses for main inventory
        );

        if (mainAddBackResult.success) {
          console.log('✅ Main vaccine inventory restored with', totalDosesToRestore, 'doses');
        } else {
          console.warn('⚠️ Warning: Failed to restore main vaccine inventory:', mainAddBackResult.error);
        }

        // Release reserved vials
        console.log('🟢 Releasing reserved vaccine vials...');
        const vialsToRelease = unusedVials;
        
        if (vialsToRelease > 0) {
          const releaseResult = await releaseBarangayVaccineReservation(
            session.barangay_id,
            session.vaccine_id,
            vialsToRelease  // Pass vials, not doses
          );

          if (releaseResult.success) {
            console.log('✅ Reserved vaccine vials released:', vialsToRelease);
          } else {
            console.warn('⚠️ Warning: Failed to release reserved vials:', releaseResult.error);
          }
        }
      }
    }

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
