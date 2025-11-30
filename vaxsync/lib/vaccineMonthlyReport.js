import { supabase } from "./supabase";

/**
 * Calculate ending inventory
 * Formula: Initial + Supplied - Used - Wastage
 * @param {number} initial - Initial inventory
 * @param {number} supplied - Quantity supplied
 * @param {number} used - Quantity used
 * @param {number} wastage - Quantity wasted
 * @returns {number} Ending inventory
 */
export function calculateEndingInventory(initial, supplied, used, wastage) {
  return Math.max(0, initial + supplied - used - wastage);
}

/**
 * Calculate stock level percentage
 * Formula: (Ending / Max Allocation) × 100
 * @param {number} endingInventory - Ending inventory
 * @param {number} maxAllocation - Max allocation
 * @returns {number} Stock percentage
 */
export function calculateStockPercentage(endingInventory, maxAllocation) {
  if (maxAllocation === 0 || maxAllocation === null) return 0;
  return parseFloat(((endingInventory / maxAllocation) * 100).toFixed(2));
}

/**
 * Determine stock status based on percentage
 * STOCKOUT: 0% or < 25%
 * UNDERSTOCK: 25-75%
 * OVERSTOCK: > 75%
 * @param {number} stockPercentage - Stock level percentage
 * @returns {object} Status object with status, color, icon
 */
export function determineStockStatus(stockPercentage) {
  const percentage = parseFloat(stockPercentage);
  
  if (percentage === 0) {
    return { status: 'STOCKOUT', color: 'bg-red-100 text-red-800', icon: '🔴' };
  }
  if (percentage < 25) {
    return { status: 'STOCKOUT', color: 'bg-red-100 text-red-800', icon: '🔴' };
  }
  if (percentage < 75) {
    return { status: 'UNDERSTOCK', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' };
  }
  return { status: 'OVERSTOCK', color: 'bg-purple-100 text-purple-800', icon: '🟣' };
}

/**
 * Fetch monthly vaccine report for a barangay
 * @param {string} barangayId - Barangay ID
 * @param {string} month - Month in YYYY-MM-01 format
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export async function fetchMonthlyVaccineReport(barangayId, month) {
  try {
    console.log('Fetching monthly report:', { barangayId, month });
    
    const { data, error } = await supabase
      .from('vaccine_monthly_report')
      .select(`
        *,
        vaccine:vaccine_id (
          id,
          name,
          batch_number,
          doses_per_vial
        )
      `)
      .eq('barangay_id', barangayId)
      .eq('month', month)
      .order('vaccine:name', { ascending: true });

    if (error) {
      console.error('Error fetching monthly report:', error);
      return { data: [], error };
    }

    console.log('Monthly report fetched:', data?.length || 0, 'vaccines');
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in fetchMonthlyVaccineReport:', err);
    return { data: [], error: err };
  }
}

/**
 * Create or get monthly vaccine report
 * @param {string} vaccineId - Vaccine ID
 * @param {string} barangayId - Barangay ID
 * @param {string} month - Month in YYYY-MM-01 format
 * @returns {Promise<{data: Object, error: Object|null}>}
 */
export async function getOrCreateMonthlyReport(vaccineId, barangayId, month) {
  try {
    // Try to fetch existing report
    const { data: existing, error: fetchError } = await supabase
      .from('vaccine_monthly_report')
      .select('*')
      .eq('vaccine_id', vaccineId)
      .eq('barangay_id', barangayId)
      .eq('month', month)
      .single();

    if (existing) {
      return { data: existing, error: null };
    }

    // If not found, create new report
    if (fetchError?.code === 'PGRST116') {
      // Record not found, create it
      const { data: newReport, error: createError } = await supabase
        .from('vaccine_monthly_report')
        .insert([{
          vaccine_id: vaccineId,
          barangay_id: barangayId,
          month: month,
          initial_inventory: 0,
          quantity_supplied: 0,
          quantity_used: 0,
          quantity_wastage: 0,
          ending_inventory: 0,
          vials_needed: 0,
          max_allocation: 0,
          stock_level_percentage: 0,
          status: 'GOOD'
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating monthly report:', createError);
        return { data: null, error: createError };
      }

      return { data: newReport, error: null };
    }

    return { data: null, error: fetchError };
  } catch (err) {
    console.error('Error in getOrCreateMonthlyReport:', err);
    return { data: null, error: err };
  }
}

/**
 * Update monthly report IN (supplied) column
 * @param {string} vaccineId - Vaccine ID
 * @param {string} barangayId - Barangay ID
 * @param {string} month - Month in YYYY-MM-01 format
 * @param {number} quantity - Quantity to add
 * @returns {Promise<{success: boolean, error: Object|null}>}
 */
export async function updateMonthlyReportIN(vaccineId, barangayId, month, quantity) {
  try {
    console.log('Updating monthly report IN:', { vaccineId, barangayId, month, quantity });

    // Get or create report
    const { data: report, error: getError } = await getOrCreateMonthlyReport(vaccineId, barangayId, month);
    if (getError || !report) {
      return { success: false, error: getError };
    }

    // Update quantity_supplied
    const newSupplied = (report.quantity_supplied || 0) + quantity;
    const endingInventory = calculateEndingInventory(
      report.initial_inventory,
      newSupplied,
      report.quantity_used,
      report.quantity_wastage
    );
    const stockPercent = calculateStockPercentage(endingInventory, report.max_allocation);
    const statusInfo = determineStockStatus(stockPercent);

    const { error: updateError } = await supabase
      .from('vaccine_monthly_report')
      .update({
        quantity_supplied: newSupplied,
        ending_inventory: endingInventory,
        stock_level_percentage: stockPercent,
        status: statusInfo.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', report.id);

    if (updateError) {
      console.error('Error updating monthly report IN:', updateError);
      return { success: false, error: updateError };
    }

    console.log('Monthly report IN updated successfully');
    return { success: true, error: null };
  } catch (err) {
    console.error('Error in updateMonthlyReportIN:', err);
    return { success: false, error: err };
  }
}

/**
 * Update monthly report OUT (used) column
 * @param {string} vaccineId - Vaccine ID
 * @param {string} barangayId - Barangay ID
 * @param {string} month - Month in YYYY-MM-01 format
 * @param {number} quantity - Quantity to add
 * @returns {Promise<{success: boolean, error: Object|null}>}
 */
export async function updateMonthlyReportOUT(vaccineId, barangayId, month, quantity) {
  try {
    console.log('Updating monthly report OUT:', { vaccineId, barangayId, month, quantity });

    // Get or create report
    const { data: report, error: getError } = await getOrCreateMonthlyReport(vaccineId, barangayId, month);
    if (getError || !report) {
      return { success: false, error: getError };
    }

    // Update quantity_used
    const newUsed = (report.quantity_used || 0) + quantity;
    const endingInventory = calculateEndingInventory(
      report.initial_inventory,
      report.quantity_supplied,
      newUsed,
      report.quantity_wastage
    );
    const stockPercent = calculateStockPercentage(endingInventory, report.max_allocation);
    const statusInfo = determineStockStatus(stockPercent);

    const { error: updateError } = await supabase
      .from('vaccine_monthly_report')
      .update({
        quantity_used: newUsed,
        ending_inventory: endingInventory,
        stock_level_percentage: stockPercent,
        status: statusInfo.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', report.id);

    if (updateError) {
      console.error('Error updating monthly report OUT:', updateError);
      return { success: false, error: updateError };
    }

    console.log('Monthly report OUT updated successfully');
    return { success: true, error: null };
  } catch (err) {
    console.error('Error in updateMonthlyReportOUT:', err);
    return { success: false, error: err };
  }
}

/**
 * Update monthly report Wastage column
 * @param {string} vaccineId - Vaccine ID
 * @param {string} barangayId - Barangay ID
 * @param {string} month - Month in YYYY-MM-01 format
 * @param {number} quantity - Quantity to add
 * @returns {Promise<{success: boolean, error: Object|null}>}
 */
export async function updateMonthlyReportWastage(vaccineId, barangayId, month, quantity) {
  try {
    console.log('Updating monthly report Wastage:', { vaccineId, barangayId, month, quantity });

    // Get or create report
    const { data: report, error: getError } = await getOrCreateMonthlyReport(vaccineId, barangayId, month);
    if (getError || !report) {
      return { success: false, error: getError };
    }

    // Update quantity_wastage
    const newWastage = (report.quantity_wastage || 0) + quantity;
    const endingInventory = calculateEndingInventory(
      report.initial_inventory,
      report.quantity_supplied,
      report.quantity_used,
      newWastage
    );
    const stockPercent = calculateStockPercentage(endingInventory, report.max_allocation);
    const statusInfo = determineStockStatus(stockPercent);

    const { error: updateError } = await supabase
      .from('vaccine_monthly_report')
      .update({
        quantity_wastage: newWastage,
        ending_inventory: endingInventory,
        stock_level_percentage: stockPercent,
        status: statusInfo.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', report.id);

    if (updateError) {
      console.error('Error updating monthly report Wastage:', updateError);
      return { success: false, error: updateError };
    }

    console.log('Monthly report Wastage updated successfully');
    return { success: true, error: null };
  } catch (err) {
    console.error('Error in updateMonthlyReportWastage:', err);
    return { success: false, error: err };
  }
}

/**
 * Get all months with data for a barangay
 * @param {string} barangayId - Barangay ID
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export async function getAvailableMonths(barangayId) {
  try {
    const { data, error } = await supabase
      .from('vaccine_monthly_report')
      .select('month')
      .eq('barangay_id', barangayId)
      .order('month', { ascending: false })
      .distinct();

    if (error) {
      console.error('Error fetching available months:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error in getAvailableMonths:', err);
    return { data: [], error: err };
  }
}

export default {
  calculateEndingInventory,
  calculateStockPercentage,
  determineStockStatus,
  fetchMonthlyVaccineReport,
  getOrCreateMonthlyReport,
  updateMonthlyReportIN,
  updateMonthlyReportOUT,
  updateMonthlyReportWastage,
  getAvailableMonths
};
