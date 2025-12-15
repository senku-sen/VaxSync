/**
 * ============================================
 * VACCINE DOSING FUNCTIONS
 * ============================================
 * Helper functions for vaccine dose operations
 * ============================================
 */

import { supabase } from "./supabase";
import { 
  getVaccineDoses, 
  getDoseDistribution,
  getDoseLabel,
  getMainVaccineFromDose 
} from "./VaccineDosingSchedule";

/**
 * Create vaccine doses when a vaccine is added
 * Automatically divides quantity among all doses
 * @param {string} vaccineId - Vaccine ID
 * @param {string} vaccineName - Vaccine name
 * @param {number} totalQuantity - Total quantity
 * @returns {Promise<{success: boolean, doses: Array, error: Object|null}>}
 */
export async function createVaccineDoses(vaccineId, vaccineName, totalQuantity) {
  try {
    console.log('Creating doses for:', { vaccineId, vaccineName, totalQuantity });
    
    // Get dose distribution
    const distribution = getDoseDistribution(vaccineName, totalQuantity);
    
    console.log('Dose distribution:', distribution);
    
    if (distribution.length === 0) {
      console.error(`Unknown vaccine: ${vaccineName}`);
      return { 
        success: false, 
        doses: [], 
        error: new Error(`Unknown vaccine: ${vaccineName}`) 
      };
    }
    
    // Create dose records
    const dosesData = distribution.map(dose => ({
      vaccine_id: vaccineId,
      dose_code: dose.doseCode,
      dose_label: dose.doseLabel,
      dose_number: dose.doseNumber,
      quantity_available: dose.quantity,
      quantity_used: 0
    }));
    
    console.log('Inserting doses:', dosesData);
    
    const { data, error } = await supabase
      .from('VaccineDoses')
      .insert(dosesData)
      .select();
    
    if (error) {
      console.error('❌ Error creating vaccine doses:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        dosesData
      });
      return { success: false, doses: [], error };
    }
    
    console.log('✅ Vaccine doses created successfully:', {
      count: data?.length || 0,
      doses: data?.map(d => ({ dose_code: d.dose_code, quantity: d.quantity_available }))
    });
    return { success: true, doses: data || [], error: null };
  } catch (err) {
    console.error('❌ Error in createVaccineDoses:', err);
    return { success: false, doses: [], error: err };
  }
}

/**
 * Get all doses for a vaccine
 * @param {string} vaccineId - Vaccine ID
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export async function getVaccineDozes(vaccineId) {
  try {
    const { data, error } = await supabase
      .from('VaccineDoses')
      .select('*')
      .eq('vaccine_id', vaccineId)
      .order('dose_number', { ascending: true });
    
    if (error) {
      console.error('Error fetching vaccine doses:', error);
      return { data: [], error };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in getVaccineDozes:', err);
    return { data: [], error: err };
  }
}

/**
 * Get dose by dose code
 * @param {string} doseCode - Dose code (e.g., "PENTA1")
 * @returns {Promise<{data: Object, error: Object|null}>}
 */
export async function getDoseByCode(doseCode) {
  try {
    const { data, error } = await supabase
      .from('VaccineDoses')
      .select('*')
      .eq('dose_code', doseCode)
      .single();
    
    if (error) {
      console.error('Error fetching dose:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Error in getDoseByCode:', err);
    return { data: null, error: err };
  }
}

/**
 * Update dose quantity
 * @param {string} doseId - Dose ID
 * @param {number} quantityUsed - Quantity used
 * @returns {Promise<{success: boolean, error: Object|null}>}
 */
export async function updateDoseQuantity(doseId, quantityUsed) {
  try {
    const { error } = await supabase
      .from('VaccineDoses')
      .update({
        quantity_used: quantityUsed,
        updated_at: new Date().toISOString()
      })
      .eq('id', doseId);
    
    if (error) {
      console.error('Error updating dose quantity:', error);
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (err) {
    console.error('Error in updateDoseQuantity:', err);
    return { success: false, error: err };
  }
}

/**
 * Deduct dose quantity (when administered)
 * @param {string} doseCode - Dose code
 * @param {number} quantityToDeduct - Quantity to deduct
 * @returns {Promise<{success: boolean, remainingQuantity: number, error: Object|null}>}
 */
export async function deductDoseQuantity(doseCode, quantityToDeduct) {
  try {
    console.log('Deducting dose quantity:', { doseCode, quantityToDeduct });
    
    // Get current dose
    const { data: dose, error: fetchError } = await supabase
      .from('VaccineDoses')
      .select('*')
      .eq('dose_code', doseCode)
      .single();
    
    if (fetchError || !dose) {
      console.error('Error fetching dose:', fetchError);
      return { success: false, remainingQuantity: 0, error: fetchError };
    }
    
    // Calculate new quantities
    const newQuantityAvailable = Math.max(0, dose.quantity_available - quantityToDeduct);
    const newQuantityUsed = dose.quantity_used + quantityToDeduct;
    
    // Update dose
    const { error: updateError } = await supabase
      .from('VaccineDoses')
      .update({
        quantity_available: newQuantityAvailable,
        quantity_used: newQuantityUsed,
        updated_at: new Date().toISOString()
      })
      .eq('id', dose.id);
    
    if (updateError) {
      console.error('Error updating dose:', updateError);
      return { success: false, remainingQuantity: 0, error: updateError };
    }
    
    console.log('Dose quantity deducted:', { 
      doseCode, 
      before: dose.quantity_available, 
      after: newQuantityAvailable 
    });
    
    return { success: true, remainingQuantity: newQuantityAvailable, error: null };
  } catch (err) {
    console.error('Error in deductDoseQuantity:', err);
    return { success: false, remainingQuantity: 0, error: err };
  }
}

/**
 * Get available doses for a barangay
 * @param {string} barangayId - Barangay ID
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export async function getAvailableDosesForBarangay(barangayId) {
  try {
    const { data, error } = await supabase
      .from('VaccineDoses')
      .select(`
        *,
        vaccine:vaccine_id (
          id,
          name,
          batch_number,
          expiry_date
        )
      `)
      .gt('quantity_available', 0)
      .order('vaccine_id', { ascending: true });
    
    if (error) {
      console.error('Error fetching available doses:', error);
      return { data: [], error };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in getAvailableDosesForBarangay:', err);
    return { data: [], error: err };
  }
}

/**
 * Get dose availability summary
 * @returns {Promise<{data: Object, error: Object|null}>}
 */
export async function getDoseAvailabilitySummary() {
  try {
    const { data, error } = await supabase
      .from('VaccineDoses')
      .select(`
        dose_code,
        quantity_available,
        quantity_used,
        vaccine:vaccine_id (name)
      `)
      .order('vaccine_id', { ascending: true });
    
    if (error) {
      console.error('Error fetching dose summary:', error);
      return { data: null, error };
    }
    
    // Group by vaccine
    const summary = {};
    data?.forEach(dose => {
      const vaccineName = dose.vaccine?.name || 'Unknown';
      if (!summary[vaccineName]) {
        summary[vaccineName] = [];
      }
      summary[vaccineName].push({
        doseCode: dose.dose_code,
        available: dose.quantity_available,
        used: dose.quantity_used,
        total: dose.quantity_available + dose.quantity_used
      });
    });
    
    return { data: summary, error: null };
  } catch (err) {
    console.error('Error in getDoseAvailabilitySummary:', err);
    return { data: null, error: err };
  }
}

/**
 * Get low stock doses
 * @param {number} threshold - Threshold quantity
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export async function getLowStockDoses(threshold = 10) {
  try {
    const { data, error } = await supabase
      .from('VaccineDoses')
      .select(`
        *,
        vaccine:vaccine_id (
          id,
          name,
          batch_number,
          expiry_date
        )
      `)
      .lt('quantity_available', threshold)
      .gt('quantity_available', 0)
      .order('quantity_available', { ascending: true });
    
    if (error) {
      console.error('Error fetching low stock doses:', error);
      return { data: [], error };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in getLowStockDoses:', err);
    return { data: [], error: err };
  }
}

/**
 * Get out of stock doses
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export async function getOutOfStockDoses() {
  try {
    const { data, error } = await supabase
      .from('VaccineDoses')
      .select(`
        *,
        vaccine:vaccine_id (
          id,
          name,
          batch_number,
          expiry_date
        )
      `)
      .eq('quantity_available', 0)
      .order('vaccine_id', { ascending: true });
    
    if (error) {
      console.error('Error fetching out of stock doses:', error);
      return { data: [], error };
    }
    
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in getOutOfStockDoses:', err);
    return { data: [], error: err };
  }
}

/**
 * Delete vaccine doses (when vaccine is deleted)
 * @param {string} vaccineId - Vaccine ID
 * @returns {Promise<{success: boolean, error: Object|null}>}
 */
export async function deleteVaccineDoses(vaccineId) {
  try {
    const { error } = await supabase
      .from('VaccineDoses')
      .delete()
      .eq('vaccine_id', vaccineId);
    
    if (error) {
      console.error('Error deleting vaccine doses:', error);
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (err) {
    console.error('Error in deleteVaccineDoses:', err);
    return { success: false, error: err };
  }
}

export default {
  createVaccineDoses,
  getVaccineDozes,
  getDoseByCode,
  updateDoseQuantity,
  deductDoseQuantity,
  getAvailableDosesForBarangay,
  getDoseAvailabilitySummary,
  getLowStockDoses,
  getOutOfStockDoses,
  deleteVaccineDoses
};
