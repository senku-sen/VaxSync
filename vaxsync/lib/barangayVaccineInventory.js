import { supabase } from "./supabase";

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
        *,
        vaccine:vaccine_id (
          id,
          name,
          batch_number,
          expiry_date
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
 * Deduct vaccine from inventory (when administered)
 * @param {string} barangayId - The barangay ID
 * @param {string} vaccineId - The vaccine ID
 * @param {number} quantityToDeduct - Number of vials to deduct
 * @returns {Promise<{success: boolean, error: Object|null}>}
 */
export async function deductBarangayVaccineInventory(barangayId, vaccineId, quantityToDeduct) {
  try {
    console.log('Deducting vaccine from inventory:', { barangayId, vaccineId, quantityToDeduct });

    // Get current inventory
    const { data: inventory, error: fetchError } = await supabase
      .from('barangay_vaccine_inventory')
      .select('id, quantity_vial, quantity_dose')
      .eq('barangay_id', barangayId)
      .eq('vaccine_id', vaccineId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (fetchError || !inventory || inventory.length === 0) {
      console.error('Inventory not found:', fetchError);
      return { success: false, error: 'Inventory not found' };
    }

    const currentInventory = inventory[0];
    const newQuantity = Math.max(0, currentInventory.quantity_vial - quantityToDeduct);

    // Update inventory
    const { error: updateError } = await supabase
      .from('barangay_vaccine_inventory')
      .update({
        quantity_vial: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentInventory.id);

    if (updateError) {
      console.error('Error deducting inventory:', updateError);
      return { success: false, error: updateError };
    }

    console.log('Inventory deducted successfully. New quantity:', newQuantity);
    return { success: true, error: null };
  } catch (err) {
    console.error('Error in deductBarangayVaccineInventory:', err);
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

export default {
  fetchBarangayVaccineInventory,
  getBarangayVaccineTotal,
  addBarangayVaccineInventory,
  updateBarangayVaccineInventory,
  deductBarangayVaccineInventory,
  getLowStockVaccines
};
