import { supabase } from "./supabase";
import { addBarangayVaccineInventory } from "./barangayVaccineInventory";

/**
 * When a vaccine request is approved, automatically add it to barangay inventory
 * @param {string} requestId - The vaccine request ID
 * @param {string} vaccineId - The vaccine ID
 * @param {string} barangayId - The barangay ID
 * @param {number} quantityVial - Quantity in vials
 * @param {number} quantityDose - Quantity in doses
 * @returns {Promise<{success: boolean, inventoryId: string|null, error: string|null}>}
 */
export async function addApprovedRequestToInventory(
  requestId,
  vaccineId,
  barangayId,
  quantityVial,
  quantityDose
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
      return { success: false, inventoryId: null, error: 'Could not fetch vaccine details' };
    }

    // Add to inventory
    const { data: inventoryData, error: inventoryError } = await addBarangayVaccineInventory({
      barangay_id: barangayId,
      vaccine_id: vaccineId,
      quantity_vial: quantityVial,
      quantity_dose: quantityDose,
      batch_number: vaccine?.batch_number || null,
      expiry_date: vaccine?.expiry_date || null,
      notes: `Auto-added from approved request #${requestId}`
    });

    if (inventoryError) {
      console.error('Error adding to inventory:', inventoryError);
      return { success: false, inventoryId: null, error: 'Failed to add to inventory' };
    }

    console.log('Successfully added to inventory:', inventoryData?.id);
    return { success: true, inventoryId: inventoryData?.id || null, error: null };
  } catch (err) {
    console.error('Error in addApprovedRequestToInventory:', err);
    return { success: false, inventoryId: null, error: err.message };
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
