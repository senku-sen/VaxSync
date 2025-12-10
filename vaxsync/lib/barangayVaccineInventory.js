import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabaseAdmin";
import { VACCINE_VIAL_MAPPING } from "./vaccineVialMapping";

/**
 * Fetch barangay vaccine inventory
 * @param {string} barangayId - The barangay ID
 * @returns {Promise<{data: Array, error: Object}>}
 */
export async function fetchBarangayVaccineInventory(barangayId) {
  try {
    console.log('Fetching vaccine inventory for barangay:', barangayId);
    
    const { data, error } = await supabase
      .from('barangay_vaccine_inventory')
      .select(`
        id,
        barangay_id,
        vaccine_id,
        quantity_vial,
        quantity_dose,
        reserved_vial,
        batch_number,
        expiry_date,
        received_date,
        created_at,
        updated_at,
        vaccine_doses:vaccine_id (
          id,
          vaccine_id,
          dose_code,
          dose_label,
          dose_number,
          quantity_available,
          vaccine:vaccine_id (
            id,
            name,
            doses
          )
        )
      `)
      .eq('barangay_id', barangayId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inventory:', error);
      return { data: [], error };
    }

    console.log('Inventory fetched:', data?.length || 0, 'items');
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in fetchBarangayVaccineInventory:', err);
    return { data: [], error: err };
  }
}

/**
 * Get total vaccine quantity for a barangay
 * @param {string} barangayId - The barangay ID
 * @param {string} vaccineId - The vaccine ID
 * @returns {Promise<{total: number, error: Object|null}>}
 */
export async function getBarangayVaccineTotal(barangayId, vaccineId) {
  try {
    const { data, error } = await supabase
      .from('barangay_vaccine_inventory')
      .select('quantity_vial, quantity_dose')
      .eq('barangay_id', barangayId)
      .eq('vaccine_id', vaccineId);

    if (error) {
      console.error('Error fetching vaccine total:', error);
      return { total: 0, error };
    }

    const total = data.reduce((sum, item) => sum + (item.quantity_vial || 0), 0);
    return { total, error: null };
  } catch (err) {
    console.error('Error in getBarangayVaccineTotal:', err);
    return { total: 0, error: err };
  }
}

/**
 * Add vaccine to barangay inventory
 * @param {Object} inventoryData - Inventory data (barangay_id, vaccine_id, quantity_vial, quantity_dose, batch_number, expiry_date)
 * @returns {Promise<{data: Object, error: Object}>}
 */
export async function addBarangayVaccineInventory(inventoryData) {
  try {
    console.log('Adding vaccine to inventory:', inventoryData);

    const { data, error } = await supabase
      .from('barangay_vaccine_inventory')
      .insert([{
        barangay_id: inventoryData.barangay_id,
        vaccine_id: inventoryData.vaccine_id,
        quantity_vial: inventoryData.quantity_vial || 0,
        quantity_dose: inventoryData.quantity_dose || 0,
        batch_number: inventoryData.batch_number || null,
        expiry_date: inventoryData.expiry_date || null,
        notes: inventoryData.notes || null,
        received_date: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Error adding inventory:', error);
      return { data: null, error };
    }

    console.log('Inventory added successfully:', data);
    return { data: data?.[0] || null, error: null };
  } catch (err) {
    console.error('Error in addBarangayVaccineInventory:', err);
    return { data: null, error: err };
  }
}

/**
 * Update vaccine inventory quantity
 * @param {string} inventoryId - The inventory record ID
 * @param {number} quantityVial - New quantity in vials
 * @param {number} quantityDose - New quantity in doses
 * @returns {Promise<{data: Object, error: Object}>}
 */
export async function updateBarangayVaccineInventory(inventoryId, quantityVial, quantityDose) {
  try {
    console.log('Updating inventory:', inventoryId, { quantityVial, quantityDose });

    const { data, error } = await supabase
      .from('barangay_vaccine_inventory')
      .update({
        quantity_vial: quantityVial,
        quantity_dose: quantityDose,
        updated_at: new Date().toISOString()
      })
      .eq('id', inventoryId)
      .select();

    if (error) {
      console.error('Error updating inventory:', error);
      return { data: null, error };
    }

    console.log('Inventory updated successfully');
    return { data: data?.[0] || null, error: null };
  } catch (err) {
    console.error('Error in updateBarangayVaccineInventory:', err);
    return { data: null, error: err };
  }
}

/**
 * Deduct vaccine from inventory (when administered) - FIFO Method
 * Deducts from oldest inventory records first, handles multiple records
 * @param {string} barangayId - The barangay ID
 * @param {string} vaccineId - The vaccine ID
 * @param {number} quantityToDeduct - Number of vials to deduct
 * @returns {Promise<{success: boolean, error: Object|null, deductedRecords: Array}>}
 */
export async function deductBarangayVaccineInventory(barangayId, vaccineId, quantityToDeduct) {
  try {
    console.log('🔴 FIFO Deducting vaccine from inventory:', { barangayId, vaccineId, quantityToDeduct });

    // Get vaccine name to look up doses per vial
    const { data: vaccineData } = await supabase
      .from('vaccines')
      .select('name')
      .eq('id', vaccineId)
      .single();

    const vaccineName = vaccineData?.name || '';
    const dosesPerVial = VACCINE_VIAL_MAPPING[vaccineName] || 1;
    console.log(`📊 Vaccine: ${vaccineName}, Doses per vial: ${dosesPerVial}`);

    // Find all vaccine_doses for this vaccine
    // barangay_vaccine_inventory.vaccine_id references vaccine_doses.id
    const { data: vaccineDoses, error: dosesError } = await supabase
      .from('vaccine_doses')
      .select('id')
      .eq('vaccine_id', vaccineId);

    if (dosesError || !vaccineDoses || vaccineDoses.length === 0) {
      console.error('No vaccine_doses found for vaccine:', vaccineId);
      return { success: false, error: 'No vaccine doses found', deductedRecords: [] };
    }

    const vaccineDoseIds = vaccineDoses.map(d => d.id);
    console.log('Vaccine dose IDs:', vaccineDoseIds);

    // Get ALL inventory records for any of these vaccine_doses in this barangay - FIFO (oldest first)
    // Use admin client if available to bypass RLS
    const fetchClient = supabaseAdmin || supabase;
    const { data: inventory, error: fetchError } = await fetchClient
      .from('barangay_vaccine_inventory')
      .select('id, quantity_vial, quantity_dose, batch_number, created_at')
      .eq('barangay_id', barangayId)
      .in('vaccine_id', vaccineDoseIds)
      .order('created_at', { ascending: true })  // ✅ FIFO - oldest first
      .order('id', { ascending: true });  // Secondary sort by ID for consistency

    if (fetchError) {
      console.error('❌ Error fetching inventory:', fetchError);
      console.error('   Error details:', JSON.stringify(fetchError, null, 2));
      return { success: false, error: fetchError, deductedRecords: [] };
    }

    if (!inventory || inventory.length === 0) {
      console.error('❌ No inventory records found for:', { barangayId, vaccineId, vaccineDoseIds });
      return { success: false, error: 'Inventory not found', deductedRecords: [] };
    }

    console.log(`Found ${inventory.length} inventory record(s) for FIFO deduction:`, 
      inventory.map(i => ({ id: i.id, quantity_vial: i.quantity_vial, batch: i.batch_number }))
    );

    let remainingToDeduct = quantityToDeduct;
    const deductedRecords = [];
    const updates = [];

    // Process each inventory record in FIFO order
    for (const record of inventory) {
      if (remainingToDeduct <= 0) break;

      const availableInThisRecord = record.quantity_vial;
      const deductFromThisRecord = Math.min(remainingToDeduct, availableInThisRecord);
      const newQuantity = availableInThisRecord - deductFromThisRecord;
      
      // Calculate doses to deduct based on vial mapping
      const dosesToDeduct = deductFromThisRecord * dosesPerVial;
      const newDoseQuantity = (record.quantity_dose || 0) - dosesToDeduct;

      console.log(`  📦 Record ${record.id} (Batch: ${record.batch_number}):`);
      console.log(`     Vials: ${availableInThisRecord} → ${newQuantity} (deducting ${deductFromThisRecord})`);
      console.log(`     Doses: ${record.quantity_dose} → ${newDoseQuantity} (deducting ${dosesToDeduct})`);

      deductedRecords.push({
        id: record.id,
        batch_number: record.batch_number,
        previousQuantity: availableInThisRecord,
        deductedQuantity: deductFromThisRecord,
        newQuantity: newQuantity,
        previousDoses: record.quantity_dose,
        deductedDoses: dosesToDeduct,
        newDoses: newDoseQuantity
      });

      // Queue this update
      updates.push({
        id: record.id,
        newQuantity: newQuantity,
        newDoseQuantity: newDoseQuantity
      });

      remainingToDeduct -= deductFromThisRecord;
    }

    // Check if we could deduct the full amount
    if (remainingToDeduct > 0) {
      console.warn(`⚠️ Warning: Could only deduct ${quantityToDeduct - remainingToDeduct}/${quantityToDeduct} vials. Shortage: ${remainingToDeduct}`);
    }

    // Apply all updates
    console.log(`📝 Applying ${updates.length} update(s) to database...`);
    
    // Use admin client if available to bypass RLS, otherwise use regular client
    const client = supabaseAdmin || supabase;
    console.log(`🔑 Using ${supabaseAdmin ? 'ADMIN' : 'REGULAR'} client for updates`);
    
    for (const update of updates) {
      console.log(`  Updating record ${update.id}:`);
      console.log(`    quantity_vial = ${update.newQuantity}, quantity_dose = ${update.newDoseQuantity}`);
      
      const { data: updatedData, error: updateError } = await client
        .from('barangay_vaccine_inventory')
        .update({
          quantity_vial: update.newQuantity,
          quantity_dose: update.newDoseQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id)
        .select();

      if (updateError) {
        console.error(`❌ ERROR updating inventory record ${update.id}:`, updateError);
        console.error(`   Error details:`, JSON.stringify(updateError, null, 2));
        return { success: false, error: updateError, deductedRecords: [] };
      } else {
        console.log(`  ✅ Record ${update.id} updated successfully`);
        console.log(`   Updated data:`, updatedData);
      }
    }

    console.log(`✅ FIFO Deduction complete. Deducted from ${deductedRecords.length} record(s):`, deductedRecords);
    return { success: true, error: null, deductedRecords };
  } catch (err) {
    console.error('Error in deductBarangayVaccineInventory:', err);
    return { success: false, error: err, deductedRecords: [] };
  }
}

/**
 * Add back vaccine to barangay inventory (when administered count is decreased) - FIFO Method
 * Adds back to oldest inventory records first, handles multiple records
 * @param {string} barangayId - The barangay ID
 * @param {string} vaccineId - The vaccine_doses ID (not vaccines.id)
 * @param {number} quantityToAdd - Number of vials to add back
 * @returns {Promise<{success: boolean, error: Object|null, addedRecords: Array}>}
 */
export async function addBackBarangayVaccineInventory(barangayId, vaccineId, quantityToAdd) {
  try {
    console.log('🟢 FIFO Adding back vaccine to inventory:', { barangayId, vaccineId, quantityToAdd });

    // Get vaccine name to look up doses per vial
    // vaccineId is vaccine_doses.id, so we need to query vaccine_doses first
    const { data: dosesData, error: dosesError } = await supabase
      .from('vaccine_doses')
      .select('id, vaccine:vaccine_id(id, name)')
      .eq('id', vaccineId)
      .single();

    if (dosesError || !dosesData) {
      console.warn('⚠️ Warning: Vaccine doses not found (may have been deleted):', dosesError?.message);
      return { success: false, error: 'Vaccine doses not found', addedRecords: [] };
    }

    const vaccineName = dosesData.vaccine?.name || '';
    const dosesPerVial = VACCINE_VIAL_MAPPING[vaccineName] || 1;
    console.log(`📊 Vaccine: ${vaccineName}, Doses per vial: ${dosesPerVial}`);

    // vaccineId is already vaccine_doses.id, so we can use it directly
    // barangay_vaccine_inventory.vaccine_id references vaccine_doses.id
    const vaccineDoseIds = [vaccineId];  // Already have the vaccine_doses.id
    console.log('Vaccine dose IDs:', vaccineDoseIds);

    // Get ALL inventory records for any of these vaccine_doses in this barangay - FIFO (oldest first)
    const { data: inventory, error: fetchError } = await supabase
      .from('barangay_vaccine_inventory')
      .select('id, quantity_vial, quantity_dose, batch_number, created_at')
      .eq('barangay_id', barangayId)
      .in('vaccine_id', vaccineDoseIds)
      .order('created_at', { ascending: true })  // ✅ FIFO - oldest first
      .order('id', { ascending: true });  // Secondary sort by ID for consistency

    if (fetchError || !inventory || inventory.length === 0) {
      console.error('Inventory not found:', fetchError);
      return { success: false, error: 'Inventory not found', addedRecords: [] };
    }

    console.log(`Found ${inventory.length} inventory record(s) for FIFO add-back:`, 
      inventory.map(i => ({ id: i.id, quantity_vial: i.quantity_vial, batch: i.batch_number }))
    );

    let remainingToAdd = quantityToAdd;
    const addedRecords = [];
    const updates = [];

    // Process each inventory record in FIFO order
    for (const record of inventory) {
      if (remainingToAdd <= 0) break;

      const currentQuantity = record.quantity_vial;
      const addToThisRecord = remainingToAdd;  // Add all remaining to this record
      const newQuantity = currentQuantity + addToThisRecord;
      
      // Calculate doses to add back based on vial mapping
      const dosesToAdd = addToThisRecord * dosesPerVial;
      const newDoseQuantity = (record.quantity_dose || 0) + dosesToAdd;

      console.log(`  📦 Record ${record.id} (Batch: ${record.batch_number}):`);
      console.log(`     Vials: ${currentQuantity} → ${newQuantity} (adding ${addToThisRecord})`);
      console.log(`     Doses: ${record.quantity_dose} → ${newDoseQuantity} (adding ${dosesToAdd})`);

      addedRecords.push({
        id: record.id,
        batch_number: record.batch_number,
        previousQuantity: currentQuantity,
        addedQuantity: addToThisRecord,
        newQuantity: newQuantity,
        previousDoses: record.quantity_dose,
        addedDoses: dosesToAdd,
        newDoses: newDoseQuantity
      });

      // Queue this update
      updates.push({
        id: record.id,
        newQuantity: newQuantity,
        newDoseQuantity: newDoseQuantity
      });

      remainingToAdd -= addToThisRecord;
    }

    // Apply all updates
    console.log(`📝 Applying ${updates.length} update(s) to database...`);
    for (const update of updates) {
      console.log(`  Updating record ${update.id}:`);
      console.log(`    quantity_vial = ${update.newQuantity}, quantity_dose = ${update.newDoseQuantity}`);
      
      const { error: updateError } = await supabase
        .from('barangay_vaccine_inventory')
        .update({
          quantity_vial: update.newQuantity,
          quantity_dose: update.newDoseQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id);

      if (updateError) {
        console.error(`❌ ERROR updating inventory record ${update.id}:`, updateError);
        return { success: false, error: updateError, addedRecords: [] };
      } else {
        console.log(`  ✅ Record ${update.id} updated successfully`);
      }
    }

    console.log(`✅ FIFO Add-back complete. Added to ${addedRecords.length} record(s):`, addedRecords);
    return { success: true, error: null, addedRecords };
  } catch (err) {
    console.error('Error in addBackBarangayVaccineInventory:', err);
    return { success: false, error: err, addedRecords: [] };
  }
}

/**
 * Reserve vaccine vials for a scheduled session
 * @param {string} barangayId - The barangay ID
 * @param {string} vaccineId - The vaccine ID
 * @param {number} quantityToReserve - Number of vials to reserve
 * @returns {Promise<{success: boolean, error: Object|null}>}
 */
export async function reserveBarangayVaccineInventory(barangayId, vaccineId, quantityToReserve) {
  try {
    console.log('Reserving vaccine from inventory:', { barangayId, vaccineId, quantityToReserve });

    // Get current inventory
    const { data: inventory, error: fetchError } = await supabase
      .from('barangay_vaccine_inventory')
      .select('id, quantity_vial, quantity_dose, reserved_vial')
      .eq('barangay_id', barangayId)
      .eq('vaccine_id', vaccineId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching inventory:', fetchError);
      return { success: false, error: `Database error: ${fetchError.message}` };
    }

    if (!inventory || inventory.length === 0) {
      console.warn('No inventory found for vaccine in this barangay:', { barangayId, vaccineId });
      return { success: false, error: `No inventory found for this vaccine in barangay. Please add vaccine to inventory first.` };
    }

    const currentInventory = inventory[0];
    const currentReserved = currentInventory.reserved_vial || 0;
    const availableVials = currentInventory.quantity_vial - currentReserved;

    // Check if enough vials are available
    if (availableVials < quantityToReserve) {
      console.warn('Not enough vials available to reserve on first check:', {
        availableVials,
        quantityToReserve,
        totalVials: currentInventory.quantity_vial,
        alreadyReserved: currentReserved
      });

      // Try to self-heal reserved_vial based on actual sessions, then retry
      const recalcResult = await recalculateReservedVials(barangayId, vaccineId);

      if (recalcResult.success) {
        console.log('Recalculated reserved vials, re-checking availability...');

        const { data: inventoryAfter, error: fetchAfterError } = await supabase
          .from('barangay_vaccine_inventory')
          .select('id, quantity_vial, quantity_dose, reserved_vial')
          .eq('barangay_id', barangayId)
          .eq('vaccine_id', vaccineId)
          .order('created_at', { ascending: true })
          .limit(1);

        if (!fetchAfterError && inventoryAfter && inventoryAfter.length > 0) {
          const inv2 = inventoryAfter[0];
          const currentReserved2 = inv2.reserved_vial || 0;
          const availableVials2 = inv2.quantity_vial - currentReserved2;

          console.log('Availability after recalculation:', {
            availableVials: availableVials2,
            totalVials: inv2.quantity_vial,
            alreadyReserved: currentReserved2
          });

          if (availableVials2 >= quantityToReserve) {
            const newReservedQuantityAfter = currentReserved2 + quantityToReserve;

            const { error: updateAfterError } = await supabase
              .from('barangay_vaccine_inventory')
              .update({
                reserved_vial: newReservedQuantityAfter,
                updated_at: new Date().toISOString()
              })
              .eq('id', inv2.id);

            if (updateAfterError) {
              console.error('Error reserving inventory after recalculation:', updateAfterError);
              return { success: false, error: updateAfterError };
            }

            console.log('Vaccine reserved successfully after recalculation. New reserved quantity:', newReservedQuantityAfter);
            return { success: true, error: null };
          }
        }
      } else {
        console.warn('Failed to recalculate reserved vials:', recalcResult.error);
      }

      // Still not enough after recalculation - return error
      console.warn('Not enough vials available to reserve even after recalculation:', {
        availableVials,
        quantityToReserve,
        totalVials: currentInventory.quantity_vial,
        alreadyReserved: currentReserved
      });
      return { 
        success: false, 
        error: `Not enough vials available to reserve. Available: ${availableVials}, Requested: ${quantityToReserve}. Total vials: ${currentInventory.quantity_vial}, Already reserved: ${currentReserved}` 
      };
    }

    const newReservedQuantity = currentReserved + quantityToReserve;

    // Update inventory with reserved quantity
    const { error: updateError } = await supabase
      .from('barangay_vaccine_inventory')
      .update({
        reserved_vial: newReservedQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentInventory.id);

    if (updateError) {
      console.error('Error reserving inventory:', updateError);
      return { success: false, error: updateError };
    }

    console.log('Vaccine reserved successfully. New reserved quantity:', newReservedQuantity);
    return { success: true, error: null };
  } catch (err) {
    console.error('Error in reserveBarangayVaccineInventory:', err);
    return { success: false, error: err };
  }
}

/**
 * Release reserved vaccine vials (when session is cancelled)
 * @param {string} barangayId - The barangay ID
 * @param {string} inventoryId - The inventory ID
 * @param {number} quantityToRelease - Number of vials to release
 * @returns {Promise<{success: boolean, error: Object|null}>}
 */
export async function releaseBarangayVaccineReservation(barangayId, inventoryId, quantityToRelease) {
  try {
    console.log('Releasing vaccine reservation:', { barangayId, inventoryId, quantityToRelease });

    if (!inventoryId) {
      console.warn('⚠️ Warning: No inventory ID provided');
      return { success: true, error: null }; // Gracefully skip
    }

    // Get current inventory directly using the inventory ID
    const { data: inventory, error: fetchError } = await supabase
      .from('barangay_vaccine_inventory')
      .select('id, reserved_vial')
      .eq('id', inventoryId)
      .single();

    if (fetchError || !inventory) {
      console.warn('⚠️ Warning: Inventory not found (may have been deleted):', fetchError?.message);
      return { success: true, error: null }; // Gracefully skip
    }

    const currentReserved = inventory.reserved_vial || 0;
    const newReservedQuantity = Math.max(0, currentReserved - quantityToRelease);

    // Update inventory
    const { error: updateError } = await supabase
      .from('barangay_vaccine_inventory')
      .update({
        reserved_vial: newReservedQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', inventory.id);

    if (updateError) {
      console.error('Error releasing reservation:', updateError);
      return { success: false, error: updateError };
    }

    console.log('Vaccine reservation released successfully. New reserved quantity:', newReservedQuantity);
    return { success: true, error: null };
  } catch (err) {
    console.error('Error in releaseBarangayVaccineReservation:', err);
    return { success: false, error: err };
  }
}

/**
 * Get low stock vaccines for a barangay
 * @param {string} barangayId - The barangay ID
 * @param {number} threshold - Minimum quantity threshold (default: 5 vials)
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export async function getLowStockVaccines(barangayId, threshold = 5) {
  try {
    const { data, error } = await supabase
      .from('barangay_vaccine_inventory')
      .select(`
        *,
        vaccine:vaccine_id (
          id,
          name
        )
      `)
      .eq('barangay_id', barangayId)
      .lt('quantity_vial', threshold);

    if (error) {
      console.error('Error fetching low stock vaccines:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in getLowStockVaccines:', err);
    return { data: [], error: err };
  }
}

/**
 * Add back to main vaccine tables (vaccines and vaccine_doses) - FIFO Method
 * Called when administered count is decreased
 * @param {string} vaccineId - The vaccine ID
 * @param {number} quantityToAdd - Number of doses to add back
 * @returns {Promise<{success: boolean, error: Object|null}>}
 */
export async function addMainVaccineInventory(vaccineId, quantityToAdd) {
  try {
    console.log('🟢 FIFO Adding back to main vaccine inventory:', { vaccineId, quantityToAdd });

    if (!vaccineId) {
      console.warn('⚠️ Warning: No vaccine ID provided');
      return { success: false, error: 'Vaccine ID is required' };
    }

    // Add back to vaccines table
    const { data: vaccineData, error: vaccineError } = await supabase
      .from('vaccines')
      .select('id, quantity_available, name')
      .eq('id', vaccineId);

    if (vaccineError || !vaccineData || vaccineData.length === 0) {
      console.warn('⚠️ Warning: Vaccine not found (may have been deleted):', vaccineError?.message);
      // Don't fail - vaccine may have been deleted, just skip main inventory update
      return { success: true, error: null };
    }

    const vaccine = vaccineData[0];

    // Get doses per vial from mapping
    const vaccineName = vaccine.name || '';
    const dosesPerVial = VACCINE_VIAL_MAPPING[vaccineName] || 1;
    const dosesToAddToVaccines = quantityToAdd * dosesPerVial;
    
    console.log(`📊 Vaccine: ${vaccineName}, Doses per vial: ${dosesPerVial}`);
    console.log(`   Adding back ${quantityToAdd} vials = ${dosesToAddToVaccines} doses to vaccines table`);

    const newVaccineQuantity = vaccine.quantity_available + dosesToAddToVaccines;

    const { error: updateVaccineError } = await supabase
      .from('vaccines')
      .update({
        quantity_available: newVaccineQuantity
      })
      .eq('id', vaccineId);

    if (updateVaccineError) {
      console.error('Error updating vaccines table:', updateVaccineError);
      return { success: false, error: updateVaccineError };
    }

    console.log(`✅ Vaccines table updated. ${vaccine.quantity_available} → ${newVaccineQuantity}`);

    // Also add back to vaccine_doses table (all doses of this vaccine)
    // Use FIFO (First-In-First-Out) - add to oldest doses first
    console.log('🔍 Attempting to fetch vaccine_doses for vaccine:', vaccineId);
    console.log(`📊 Using same mapping: Doses per vial: ${dosesPerVial}, Total doses to add: ${dosesToAddToVaccines}`);
    
    const { data: doses, error: fetchDosesError } = await supabase
      .from('vaccine_doses')
      .select('id, quantity_available, dose_code, created_at')
      .eq('vaccine_id', vaccineId)
      .order('created_at', { ascending: true })  // ✅ FIFO - oldest first
      .order('id', { ascending: true });

    if (fetchDosesError) {
      console.log('ℹ️ Info: vaccine_doses table not available (optional feature)');
      // Don't fail - vaccine_doses is optional
    } else if (!doses) {
      console.log('ℹ️ Info: vaccine_doses query returned null (optional feature)');
    } else if (doses.length === 0) {
      console.log(`ℹ️ Info: No vaccine_doses found for vaccine ${vaccineId} (optional feature - skipping)`);
    } else {
      console.log(`✅ Found ${doses.length} dose record(s) for FIFO add-back:`, 
        doses.map(d => ({ id: d.id, dose_code: d.dose_code, quantity: d.quantity_available }))
      );

      // Add back to doses in FIFO order
      let remainingToAdd = dosesToAddToVaccines;

      for (const dose of doses) {
        if (remainingToAdd <= 0) break;

        const addToThisDose = remainingToAdd;  // Add all remaining to this dose
        const newDoseQuantity = dose.quantity_available + addToThisDose;

        console.log(`  💉 Dose ${dose.dose_code} (${dose.id}): ${dose.quantity_available} → ${newDoseQuantity} (adding ${addToThisDose} doses)`);

        const { error: updateDoseError } = await supabase
          .from('vaccine_doses')
          .update({
            quantity_available: newDoseQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', dose.id);

        if (updateDoseError) {
          console.error(`❌ ERROR: Could not update dose ${dose.id}:`, updateDoseError);
        } else {
          console.log(`✅ Dose ${dose.dose_code} updated. Added back: ${addToThisDose}, New quantity: ${newDoseQuantity}`);
          remainingToAdd -= addToThisDose;
        }
      }
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error in addMainVaccineInventory:', err);
    return { success: false, error: err };
  }
}

/**
 * Deduct from main vaccine tables (vaccines and vaccine_doses) - FIFO Method
 * Called when vaccination is administered
 * @param {string} vaccineId - The vaccine ID
 * @param {number} quantityToDeduct - Number of doses to deduct
 * @returns {Promise<{success: boolean, error: Object|null}>}
 */
export async function deductMainVaccineInventory(vaccineId, quantityToDeduct) {
  try {
    console.log('🔴 FIFO Deducting from main vaccine inventory:', { vaccineId, quantityToDeduct });

    if (!vaccineId) {
      console.warn('⚠️ Warning: No vaccine ID provided');
      return { success: false, error: 'Vaccine ID is required' };
    }

    // Deduct from vaccines table
    const { data: vaccine, error: vaccineError } = await supabase
      .from('vaccines')
      .select('id, quantity_available, name')
      .eq('id', vaccineId)
      .single();

    if (vaccineError || !vaccine) {
      console.warn('⚠️ Warning: Vaccine not found (may have been deleted):', vaccineError?.message);
      // Don't fail - vaccine may have been deleted, just skip main inventory update
      return { success: true, error: null };
    }

    // Get vaccine name (quantityToDeduct is ALREADY in doses, no need to multiply again)
    const vaccineName = vaccine.name || '';
    
    console.log(`📊 Vaccine: ${vaccineName}`);
    console.log(`   Deducting ${quantityToDeduct} doses from vaccines table`);

    const newVaccineQuantity = Math.max(0, vaccine.quantity_available - quantityToDeduct);

    // Use admin client if available to bypass RLS
    const client = supabaseAdmin || supabase;
    console.log(`🔑 Using ${supabaseAdmin ? 'ADMIN' : 'REGULAR'} client for vaccines table update`);

    const { error: updateVaccineError } = await client
      .from('vaccines')
      .update({
        quantity_available: newVaccineQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', vaccineId)
      .select();

    if (updateVaccineError) {
      console.error('Error updating vaccines table:', updateVaccineError);
      return { success: false, error: updateVaccineError };
    }

    console.log(`✅ Vaccines table updated. ${vaccine.quantity_available} → ${newVaccineQuantity}`);

    // Also deduct from vaccine_doses table (all doses of this vaccine)
    // Use FIFO (First-In-First-Out) - deduct from oldest doses first
    console.log('🔍 Attempting to fetch vaccine_doses for vaccine:', vaccineId);
    console.log(`📊 Total doses to deduct: ${quantityToDeduct}`);
    
    const { data: doses, error: fetchDosesError } = await supabase
      .from('vaccine_doses')
      .select('id, quantity_available, dose_code, created_at')
      .eq('vaccine_id', vaccineId)
      .order('created_at', { ascending: true })  // ✅ FIFO - oldest first
      .order('id', { ascending: true });

    if (fetchDosesError) {
      console.log('ℹ️ Info: vaccine_doses table not available (optional feature)');
      // Don't fail - vaccine_doses is optional
    } else if (!doses) {
      console.log('ℹ️ Info: vaccine_doses query returned null (optional feature)');
    } else if (doses.length === 0) {
      console.log(`ℹ️ Info: No vaccine_doses found for vaccine ${vaccineId} (optional feature - skipping)`);
    } else {
      console.log(`✅ Found ${doses.length} dose record(s) for FIFO deduction:`, 
        doses.map(d => ({ id: d.id, dose_code: d.dose_code, quantity: d.quantity_available }))
      );

      // Deduct from doses in FIFO order
      let remainingToDeduct = quantityToDeduct;

      for (const dose of doses) {
        if (remainingToDeduct <= 0) break;

        const deductFromThisDose = Math.min(remainingToDeduct, dose.quantity_available);
        const newDoseQuantity = dose.quantity_available - deductFromThisDose;

        console.log(`  💉 Dose ${dose.dose_code} (${dose.id}): ${dose.quantity_available} → ${newDoseQuantity} (deducting ${deductFromThisDose} doses)`);

        const { error: updateDoseError } = await supabase
          .from('vaccine_doses')
          .update({
            quantity_available: newDoseQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', dose.id);

        if (updateDoseError) {
          console.error(`❌ ERROR: Could not update dose ${dose.id}:`, updateDoseError);
        } else {
          console.log(`✅ Dose ${dose.dose_code} updated. Deducted: ${deductFromThisDose}, New quantity: ${newDoseQuantity}`);
          remainingToDeduct -= deductFromThisDose;
        }
      }

      if (remainingToDeduct > 0) {
        console.warn(`⚠️ Warning: Could only deduct ${quantityToDeduct - remainingToDeduct}/${quantityToDeduct} doses. Shortage: ${remainingToDeduct}`);
      }
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error in deductMainVaccineInventory:', err);
    return { success: false, error: err };
  }
}

/**
 * Recalculate and fix reserved vials based on actual scheduled sessions
 * @param {string} barangayId - The barangay ID
 * @param {string} vaccineId - The vaccine ID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function recalculateReservedVials(barangayId, vaccineId) {
  try {
    console.log('Recalculating reserved vials:', { barangayId, vaccineId });

    // Get all scheduled/in-progress sessions for this vaccine and barangay
    const { data: sessions, error: sessionsError } = await supabase
      .from('vaccination_sessions')
      .select('target, administered, status')
      .eq('vaccine_id', vaccineId)
      .eq('barangay_id', barangayId)
      .in('status', ['Scheduled', 'In progress']);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return { success: false, error: sessionsError.message };
    }

    // Calculate correct reserved vials: sum of (target - administered) for each session
    const correctReserved = (sessions || []).reduce((sum, session) => {
      const remaining = (session.target || 0) - (session.administered || 0);
      return sum + Math.max(0, remaining);
    }, 0);

    console.log('Correct reserved vials should be:', correctReserved);

    // Update the inventory with correct reserved vials
    const { error: updateError } = await supabase
      .from('barangay_vaccine_inventory')
      .update({
        reserved_vial: correctReserved,
        updated_at: new Date().toISOString()
      })
      .eq('barangay_id', barangayId)
      .eq('vaccine_id', vaccineId);

    if (updateError) {
      console.error('Error updating reserved vials:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('✅ Reserved vials recalculated successfully:', correctReserved);
    return { success: true, error: null };
  } catch (err) {
    console.error('Error in recalculateReservedVials:', err);
    return { success: false, error: err.message };
  }
}

export default {
  fetchBarangayVaccineInventory,
  getBarangayVaccineTotal,
  addBarangayVaccineInventory,
  updateBarangayVaccineInventory,
  deductBarangayVaccineInventory,
  addBackBarangayVaccineInventory,
  addMainVaccineInventory,
  deductMainVaccineInventory,
  reserveBarangayVaccineInventory,
  releaseBarangayVaccineReservation,
  getLowStockVaccines,
  recalculateReservedVials
};
