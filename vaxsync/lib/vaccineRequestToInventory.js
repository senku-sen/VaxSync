import { supabase } from "./supabase";
import { addBarangayVaccineInventory, updateBarangayVaccineInventory, deductMainVaccineInventory } from "./barangayVaccineInventory";
import { VACCINE_VIAL_MAPPING } from "./vaccineVialMapping";

/**
 * When a vaccine request is approved, automatically add it to barangay inventory
 * Smart deduction: If barangay has existing inventory of this vaccine dose, deduct from it
 * Otherwise, create a new inventory record
 * @param {string} requestId - The vaccine request ID
 * @param {string} vaccineId - The vaccine ID
 * @param {string} barangayId - The barangay ID
 * @param {number} quantityVial - Quantity in vials
 * @param {number} quantityDose - Quantity in doses
 * @param {string} doseCode - Optional: specific dose code (e.g., "TT1", "TT2") to deduct from
 * @returns {Promise<{success: boolean, inventoryId: string|null, error: string|null, deductedFromExisting: boolean}>}
 */
export async function addApprovedRequestToInventory(
  requestId,
  vaccineId,
  barangayId,
  quantityVial,
  quantityDose,
  doseCode = null
) {
  try {
    console.log('Adding approved vaccine request to inventory:', {
      requestId,
      vaccineId,
      barangayId,
      quantityVial,
      quantityDose
    });

    // Fetch vaccine details to get batch number and expiry date
    const { data: vaccine, error: vaccineError } = await supabase
      .from('vaccines')
      .select('batch_number, expiry_date')
      .eq('id', vaccineId)
      .single();

    if (vaccineError) {
      console.error('Error fetching vaccine details:', vaccineError);
      return { success: false, inventoryId: null, error: 'Could not fetch vaccine details', deductedFromExisting: false };
    }

    // Fetch the vaccine_doses record for this vaccine
    // barangay_vaccine_inventory.vaccine_id now references vaccine_doses.id
    const { data: vaccineDose, error: dosesError } = await supabase
      .from('vaccine_doses')
      .select('id')
      .eq('vaccine_id', vaccineId)
      .limit(1)
      .single();

    if (dosesError || !vaccineDose) {
      console.error('Error fetching vaccine dose:', dosesError);
      return { success: false, inventoryId: null, error: 'No vaccine dose found. Please create vaccine doses first.', deductedFromExisting: false };
    }

    // Check if barangay already has this vaccine dose in inventory
    const { data: existingInventory, error: existingError } = await supabase
      .from('barangay_vaccine_inventory')
      .select('id, quantity_vial, quantity_dose')
      .eq('barangay_id', barangayId)
      .eq('vaccine_id', vaccineDose.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let inventoryId = null;
    let deductedFromExisting = false;

    if (existingInventory && !existingError) {
      // Barangay has existing inventory - deduct from it
      console.log('Found existing inventory, deducting from it:', existingInventory.id);
      
      const newQuantityVial = Math.max(0, (existingInventory.quantity_vial || 0) - quantityVial);
      const newQuantityDose = Math.max(0, (existingInventory.quantity_dose || 0) - quantityDose);
      
      const { data: updatedInventory, error: updateError } = await updateBarangayVaccineInventory(
        existingInventory.id,
        newQuantityVial,
        newQuantityDose
      );

      if (updateError) {
        console.error('Error deducting from existing inventory:', updateError);
        return { success: false, inventoryId: null, error: 'Failed to deduct from existing inventory', deductedFromExisting: false };
      }

      inventoryId = existingInventory.id;
      deductedFromExisting = true;
      console.log('✅ Successfully deducted from existing inventory:', {
        inventoryId,
        previousVial: existingInventory.quantity_vial,
        newVial: newQuantityVial,
        previousDose: existingInventory.quantity_dose,
        newDose: newQuantityDose
      });
    } else {
      // No existing inventory - create new record
      console.log('No existing inventory found, creating new record');
      
      const { data: inventoryData, error: inventoryError } = await addBarangayVaccineInventory({
        barangay_id: barangayId,
        vaccine_id: vaccineDose.id,  // Use vaccine_doses.id, not vaccines.id
        quantity_vial: quantityVial,
        quantity_dose: quantityDose,
        batch_number: vaccine?.batch_number || null,
        expiry_date: vaccine?.expiry_date || null,
        notes: `Auto-added from approved request #${requestId}`
      });

      if (inventoryError) {
        console.error('Error adding to inventory:', inventoryError);
        return { success: false, inventoryId: null, error: 'Failed to add to inventory', deductedFromExisting: false };
      }

      inventoryId = inventoryData?.id || null;
      deductedFromExisting = false;
      console.log('✅ Successfully created new inventory record:', inventoryId);
    }

    // ✅ Step 2: Deduct from main vaccine tables (vaccines and vaccine_doses)
    console.log('📊 Deducting from main vaccine inventory...');
    
    // Get vaccine name to calculate doses
    const { data: vaccineData, error: vaccineNameError } = await supabase
      .from('vaccines')
      .select('name')
      .eq('id', vaccineId)
      .single();

    if (!vaccineNameError && vaccineData) {
      const vaccineName = vaccineData.name || '';
      const dosesPerVial = VACCINE_VIAL_MAPPING[vaccineName] || 1;
      const dosesToDeduct = quantityVial * dosesPerVial;

      console.log(`💉 Vaccine: ${vaccineName}, Vials: ${quantityVial}, Doses per vial: ${dosesPerVial}, Total doses to deduct: ${dosesToDeduct}`);

      // If doseCode is provided, deduct only from that specific dose
      if (doseCode) {
        console.log(`🎯 Deducting from specific dose: ${doseCode}`);
        
        // Deduct from specific vaccine_dose only
        const { data: dose, error: doseError } = await supabase
          .from('vaccine_doses')
          .select('id, quantity_available')
          .eq('dose_code', doseCode)
          .eq('vaccine_id', vaccineId)
          .single();

        if (!doseError && dose) {
          const newDoseQuantity = Math.max(0, dose.quantity_available - dosesToDeduct);
          
          const { error: updateError } = await supabase
            .from('vaccine_doses')
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

        // Also deduct from main vaccines table
        const { data: vaccine, error: vaccineError } = await supabase
          .from('vaccines')
          .select('id, quantity_available')
          .eq('id', vaccineId)
          .single();

        if (!vaccineError && vaccine) {
          const newVaccineQuantity = Math.max(0, vaccine.quantity_available - dosesToDeduct);
          
          const { error: updateError } = await supabase
            .from('vaccines')
            .update({
              quantity_available: newVaccineQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', vaccineId);

          if (!updateError) {
            console.log(`✅ Successfully deducted ${dosesToDeduct} doses from vaccines table. ${vaccine.quantity_available} → ${newVaccineQuantity}`);
          } else {
            console.warn(`⚠️ Warning: Failed to deduct from vaccines table:`, updateError);
          }
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

    return { success: true, inventoryId, error: null, deductedFromExisting };
  } catch (err) {
    console.error('Error in addApprovedRequestToInventory:', err);
    return { success: false, inventoryId: null, error: err.message, deductedFromExisting: false };
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
      .from('vaccine_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      console.error('Error fetching request:', fetchError);
      return { success: false, error: 'Request not found' };
    }

    // Update request status to approved
    const { error: updateError } = await supabase
      .from('vaccine_requests')
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
