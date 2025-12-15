import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabaseAdmin";
import { addBarangayVaccineInventory, updateBarangayVaccineInventory, deductMainVaccineInventory } from "./BarangayVaccineInventory";
import { VACCINE_VIAL_MAPPING } from "./vaccineVialMapping";

/**
 * When a vaccine request is approved, transfer vaccines from source to destination barangay
 * Step 1: Deduct from source barangay (Public Health Nurse's central inventory)
 * Step 2: Add to destination barangay (Health Worker's assigned barangay)
 * @param {string} requestId - The vaccine request ID
 * @param {string} vaccineId - The vaccine ID
 * @param {string} sourceBarangayId - The barangay ID to DEDUCT from (Public Health Nurse's barangay)
 * @param {string} destinationBarangayId - The barangay ID to ADD to (Health Worker's barangay)
 * @param {number} quantityVial - Quantity in vials
 * @param {number} quantityDose - Quantity in doses
 * @param {string} doseCode - Optional: specific dose code (e.g., "TT1", "TT2") to deduct from
 * @returns {Promise<{success: boolean, inventoryId: string|null, error: string|null, deductedFromSource: boolean, addedToDestination: boolean}>}
 */
export async function addApprovedRequestToInventory(
  requestId,
  vaccineId,
  sourceBarangayId,
  destinationBarangayId,
  quantityVial,
  quantityDose,
  doseCode = null
) {
  try {
    console.log('🔄 Transferring vaccine from source to destination barangay:', {
      requestId,
      vaccineId,
      sourceBarangayId,
      destinationBarangayId,
      quantityVial,
      quantityDose
    });

    // Fetch vaccine details to get batch number, expiry date, and quantity_available
    const { data: vaccine, error: vaccineError } = await supabase
      .from('Vaccines')
      .select('batch_number, expiry_date, name, quantity_available')
      .eq('id', vaccineId)
      .single();

    if (vaccineError) {
      console.error('Error fetching vaccine details:', vaccineError);
      return { success: false, inventoryId: null, error: 'Could not fetch vaccine details', deductedFromExisting: false };
    }

    // vaccineId could be either:
    // 1. vaccine_doses.id (from barangay_vaccine_inventory.vaccine_id)
    // 2. vaccines.id (from form submission)
    // Try to fetch as vaccine_doses first, if that fails, treat it as vaccines.id
    
    let vaccineDoseId = vaccineId;
    let actualVaccineId = vaccineId;
    
    console.log('🔍 Checking if vaccineId is vaccine_doses.id or vaccines.id:', vaccineId);
    const { data: vaccineDose, error: doseError } = await supabase
      .from('VaccineDoses')
      .select('id, vaccine_id')
      .eq('id', vaccineId)
      .single();

    if (!doseError && vaccineDose) {
      // It was a vaccine_doses.id, extract the actual vaccine ID
      vaccineDoseId = vaccineDose.id;
      actualVaccineId = vaccineDose.vaccine_id;
      console.log('✅ vaccineId is vaccine_doses.id, extracted vaccine_id:', actualVaccineId);
    } else {
      // It's likely already a vaccines.id, need to find the vaccine_doses record
      console.log('ℹ️ vaccineId is vaccines.id, finding vaccine_doses record...');
      const { data: dose, error: dosesError } = await supabase
        .from('VaccineDoses')
        .select('id, vaccine_id')
        .eq('vaccine_id', vaccineId)
        .limit(1)
        .single();

      if (dosesError || !dose) {
        console.error('Error fetching vaccine dose:', dosesError);
        return { success: false, inventoryId: null, error: 'No vaccine dose found. Please create vaccine doses first.', deductedFromExisting: false };
      }
      
      vaccineDoseId = dose.id;
      actualVaccineId = dose.vaccine_id;
      console.log('✅ Found vaccine_doses record:', { vaccineDoseId, actualVaccineId });
    }

    console.log(`📌 Resolved vaccine IDs: vaccineId=${vaccineId}, vaccineDoseId=${vaccineDoseId}, actualVaccineId=${actualVaccineId}`);

    // ✅ Step 1: DEDUCT from SOURCE barangay (Public Health Nurse's central inventory)
    console.log('📊 Step 1: Deducting from source barangay:', sourceBarangayId);
    
    const { data: sourceInventory, error: sourceError } = await supabase
      .from('BarangayVaccineInventory')
      .select('id, quantity_vial, quantity_dose')
      .eq('barangay_id', sourceBarangayId)
      .eq('vaccine_id', vaccineDoseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let deductedFromSource = false;

    if (sourceInventory && !sourceError) {
      // Source barangay has inventory - deduct from it
      console.log('Found source inventory, deducting from it:', sourceInventory.id);
      
      const newSourceVial = Math.max(0, (sourceInventory.quantity_vial || 0) - quantityVial);
      const newSourceDose = Math.max(0, (sourceInventory.quantity_dose || 0) - quantityDose);
      
      const { error: deductError } = await updateBarangayVaccineInventory(
        sourceInventory.id,
        newSourceVial,
        newSourceDose
      );

      if (deductError) {
        console.error('Error deducting from source inventory:', deductError);
        return { success: false, inventoryId: null, error: 'Failed to deduct from source barangay inventory', deductedFromSource: false, addedToDestination: false };
      }

      deductedFromSource = true;
      console.log('✅ Successfully deducted from source inventory:', {
        inventoryId: sourceInventory.id,
        previousVial: sourceInventory.quantity_vial,
        newVial: newSourceVial,
        previousDose: sourceInventory.quantity_dose,
        newDose: newSourceDose
      });
    } else {
      console.warn('⚠️ Warning: Source barangay has no existing inventory for this vaccine');
      // Continue anyway - destination will still be added
    }

    // ✅ Step 2: ADD to DESTINATION barangay (Health Worker's assigned barangay)
    console.log('📦 Step 2: Adding to destination barangay:', destinationBarangayId);
    
    const { data: destInventory, error: destError } = await supabase
      .from('BarangayVaccineInventory')
      .select('id, quantity_vial, quantity_dose')
      .eq('barangay_id', destinationBarangayId)
      .eq('vaccine_id', vaccineDoseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let inventoryId = null;
    let addedToDestination = false;

    if (destInventory && !destError) {
      // Destination barangay has existing inventory - add to it
      console.log('Found destination inventory, adding to it:', destInventory.id);
      
      const newDestVial = (destInventory.quantity_vial || 0) + quantityVial;
      const newDestDose = (destInventory.quantity_dose || 0) + quantityDose;
      
      const { error: addError } = await updateBarangayVaccineInventory(
        destInventory.id,
        newDestVial,
        newDestDose
      );

      if (addError) {
        console.error('Error adding to destination inventory:', addError);
        return { success: false, inventoryId: null, error: 'Failed to add to destination barangay inventory', deductedFromSource, addedToDestination: false };
      }

      inventoryId = destInventory.id;
      addedToDestination = true;
      console.log('✅ Successfully added to destination inventory:', {
        inventoryId,
        previousVial: destInventory.quantity_vial,
        newVial: newDestVial,
        previousDose: destInventory.quantity_dose,
        newDose: newDestDose
      });
    } else {
      // No existing inventory in destination - create new record
      console.log('No existing inventory in destination, creating new record');
      
      const { data: inventoryData, error: inventoryError } = await addBarangayVaccineInventory({
        barangay_id: destinationBarangayId,
        vaccine_id: vaccineDoseId,  // Use vaccine_doses.id, not vaccines.id
        quantity_vial: quantityVial,
        quantity_dose: quantityDose,
        batch_number: vaccine?.batch_number || null,
        expiry_date: vaccine?.expiry_date || null,
        notes: `Transferred from approved request #${requestId}`
      });

      if (inventoryError) {
        console.error('Error creating destination inventory:', inventoryError);
        return { success: false, inventoryId: null, error: 'Failed to create destination inventory', deductedFromSource, addedToDestination: false };
      }

      inventoryId = inventoryData?.id || null;
      addedToDestination = true;
      console.log('✅ Successfully created destination inventory record:', inventoryId);
    }

    // ✅ Step 2: Deduct from main vaccine tables (vaccines and vaccine_doses)
    console.log('📊 Deducting from main vaccine inventory...');
    
    // Use vaccine name from the already-fetched vaccine data
    const vaccineName = vaccine?.name || '';
    const dosesPerVial = VACCINE_VIAL_MAPPING[vaccineName] || 1;
    const dosesToDeduct = quantityVial * dosesPerVial;

    console.log(`💉 Vaccine: ${vaccineName}, Vials: ${quantityVial}, Doses per vial: ${dosesPerVial}, Total doses to deduct: ${dosesToDeduct}`);

    if (vaccineName) {

      // If doseCode is provided, deduct only from that specific dose
      if (doseCode) {
        console.log(`🎯 Deducting from specific dose: ${doseCode}`);
        
        // Deduct from specific vaccine_dose only
        const { data: dose, error: doseError } = await supabase
          .from('VaccineDoses')
          .select('id, quantity_available')
          .eq('dose_code', doseCode)
          .eq('vaccine_id', vaccineId)
          .single();

        if (!doseError && dose) {
          const newDoseQuantity = Math.max(0, dose.quantity_available - dosesToDeduct);
          
          const { error: updateError } = await supabase
            .from('VaccineDoses')
            .update({
              quantity_available: newDoseQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', dose.id);

          if (!updateError) {
            console.log(`✅ Successfully deducted ${dosesToDeduct} doses from ${doseCode}. ${dose.quantity_available} → ${newDoseQuantity}`);
          } else {
            console.warn(`⚠️ Warning: Failed to deduct from dose ${doseCode}:`, updateError);
          }
        } else {
          console.warn(`⚠️ Warning: Dose ${doseCode} not found for vaccine ${vaccineId}`);
        }

        // Also deduct from main vaccines table using actualVaccineId from vaccine_doses
        console.log(`🔍 Fetching vaccines record with actualVaccineId: ${actualVaccineId}`);
        
        const { data: vaccine, error: vaccineError } = await supabase
          .from('Vaccines')
          .select('id, quantity_available')
          .eq('id', actualVaccineId)
          .single();

        if (vaccineError) {
          console.error(`❌ Error fetching vaccines record:`, vaccineError);
        }

        if (!vaccineError && vaccine) {
          console.log(`📊 Current vaccines quantity: ${vaccine.quantity_available}`);
          const newVaccineQuantity = Math.max(0, vaccine.quantity_available - dosesToDeduct);
          
          // Use admin client to bypass RLS
          const client = supabaseAdmin || supabase;
          console.log(`🔑 Using ${supabaseAdmin ? 'ADMIN' : 'REGULAR'} client to update vaccines table`);
          
          const { error: updateError } = await client
            .from('Vaccines')
            .update({
              quantity_available: newVaccineQuantity
            })
            .eq('id', actualVaccineId)
            .select();

          if (!updateError) {
            console.log(`✅ Successfully deducted ${dosesToDeduct} doses from vaccines table. ${vaccine.quantity_available} → ${newVaccineQuantity}`);
          } else {
            console.error(`❌ Error updating vaccines table:`, updateError);
            console.warn(`⚠️ Warning: Failed to deduct from vaccines table:`, updateError);
          }
        } else {
          console.warn(`⚠️ Warning: Vaccine record not found for ID: ${actualVaccineId}`);
        }
      } else {
        // No specific dose code - use the old logic (deduct from all doses)
        console.log('⚠️ No specific dose code provided - deducting from all doses of this vaccine');
        const deductResult = await deductMainVaccineInventory(vaccineId, dosesToDeduct);

        if (deductResult.success) {
          console.log('✅ Successfully deducted from main vaccine inventory (vaccines and vaccine_doses tables)');
        } else {
          console.warn('⚠️ Warning: Failed to deduct from main vaccine inventory:', deductResult.error);
        }
      }
    } else {
      console.warn('⚠️ Warning: Could not fetch vaccine name for deduction calculation');
    }

    return { success: true, inventoryId, error: null, deductedFromSource, addedToDestination };
  } catch (err) {
    console.error('Error in addApprovedRequestToInventory:', err);
    return { success: false, inventoryId: null, error: err.message, deductedFromSource: false, addedToDestination: false };
  }
}

/**
 * Update vaccine request status to "approved" and add to inventory
 * @param {string} requestId - The vaccine request ID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function approveVaccineRequestAndAddToInventory(requestId) {
  try {
    console.log('Approving vaccine request and adding to inventory:', requestId);

    // Get request details
    const { data: request, error: fetchError } = await supabase
      .from('VaccineRequests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      console.error('Error fetching request:', fetchError);
      return { success: false, error: 'Request not found' };
    }

    // Update request status to approved
    const { error: updateError } = await supabase
      .from('VaccineRequests')
      .update({ status: 'approved' })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request status:', updateError);
      return { success: false, error: 'Failed to update request status' };
    }

    // Add to inventory
    const { success, error: inventoryError } = await addApprovedRequestToInventory(
      requestId,
      request.vaccine_id,
      request.barangay_id,
      request.quantity_vial || 0,
      request.quantity_dose || 0
    );

    if (!success) {
      console.error('Error adding to inventory:', inventoryError);
      // Note: Request is already approved, but inventory add failed
      return { success: false, error: `Request approved but inventory add failed: ${inventoryError}` };
    }

    console.log('Request approved and added to inventory successfully');
    return { success: true, error: null };
  } catch (err) {
    console.error('Error in approveVaccineRequestAndAddToInventory:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Batch approve multiple vaccine requests and add all to inventory
 * @param {Array<string>} requestIds - Array of vaccine request IDs
 * @returns {Promise<{successCount: number, failureCount: number, errors: Array}>}
 */
export async function batchApproveAndAddToInventory(requestIds) {
  try {
    console.log('Batch approving requests:', requestIds);

    const results = {
      successCount: 0,
      failureCount: 0,
      errors: []
    };

    for (const requestId of requestIds) {
      const { success, error } = await approveVaccineRequestAndAddToInventory(requestId);
      if (success) {
        results.successCount++;
      } else {
        results.failureCount++;
        results.errors.push({ requestId, error });
      }
    }

    console.log('Batch approval results:', results);
    return results;
  } catch (err) {
    console.error('Error in batchApproveAndAddToInventory:', err);
    return {
      successCount: 0,
      failureCount: requestIds.length,
      errors: [{ error: err.message }]
    };
  }
}

export default {
  addApprovedRequestToInventory,
  approveVaccineRequestAndAddToInventory,
  batchApproveAndAddToInventory
};
