import { supabase } from "./supabase";

/**
 * NIP Monthly Vials Needed Reference Table
 * Fixed values based on National Immunization Program
 */
const MONTHLY_VIALS_NEEDED = {
  'bcg': 11,
  'bcg diluent': 11,
  'hep b': 11,
  'hep b (10 dose)': 11,
  'pentavalent': 289,
  'bopv': 18,
  'dropper': 18,
  'pcv10': 72,
  'pcv10 (4 dose)': 72,
  'ipv': 22,
  'ipv 10 dose': 22,
  'mmr': 24,
  'mmr diluent': 24,
  'mr': 24,
  'mr diluent': 24,
  'td': 22,
  'td10': 22,
  'tt': 108,
  'tt1': 108,
  'hpv': 96,
  'ppv': 96,
  'ppv23': 96,
  'flu': 11
};

/**
 * MAX ALLOCATION (Buffer + 1 month) Reference Table
 * Fixed values based on National Immunization Program
 */
const MAX_ALLOCATION = {
  'bcg': 23,
  'bcg diluent': 275,
  'hep b': 22,
  'hep b (10 dose)': 22,
  'pentavalent': 578,
  'bopv': 37,
  'dropper': 439,
  'pcv10': 145,
  'pcv10 (4 dose)': 145,
  'ipv': 43,
  'ipv 10 dose': 43,
  'mmr': 49,
  'mmr diluent': 586,
  'mr': 49,
  'mr diluent': 586,
  'td': 43,
  'td10': 43,
  'tt': 217,
  'tt1': 217,
  'hpv': 193,
  'ppv': 193,
  'ppv23': 193,
  'flu': 23
};

/**
 * Get monthly vials needed for a vaccine
 * @param {string} vaccineName - Vaccine name
 * @returns {number} Monthly vials needed
 */
export function getMonthlyVialsNeeded(vaccineName) {
  const key = vaccineName.toLowerCase().trim();
  return MONTHLY_VIALS_NEEDED[key] || 0;
}

/**
 * Get max allocation (buffer stock) for a vaccine
 * @param {string} vaccineName - Vaccine name
 * @returns {number} Max allocation
 */
export function getMaxAllocation(vaccineName) {
  const key = vaccineName.toLowerCase().trim();
  return MAX_ALLOCATION[key] || 0;
}

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
 * Calculate monthly vaccine report in real-time from transaction data
 * Aggregates data across all barangays for each vaccine
 * @param {string} month - Month in YYYY-MM-01 format (e.g., "2025-12-01")
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export async function fetchMonthlyVaccineReport(barangayId, month) {
  try {
    console.log('📊 Calculating monthly report (vaccines only):', { month });
    
    // Parse month to get start and end dates
    const monthDate = new Date(month);
    const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`📅 Date range: ${startDateStr} to ${endDateStr}`);

    // Get all vaccines
    const { data: vaccines, error: vaccineError } = await supabase
      .from('vaccines')
      .select('id, name, batch_number');

    if (vaccineError) {
      console.error('Error fetching vaccines:', vaccineError);
      return { data: [], error: vaccineError };
    }

    const reportMap = new Map(); // Use Map to merge duplicates by vaccine name

    // For each vaccine, calculate aggregated data across ALL barangays
    for (const vaccine of vaccines) {
      console.log(`\n🔍 Processing: ${vaccine.name}`);

      // Get ALL vaccination sessions for this vaccine across all barangays for the month
      const { data: sessions, error: sessionError } = await supabase
        .from('vaccination_sessions')
        .select('id, administered, target, session_date')
        .eq('vaccine_id', vaccine.id)
        .gte('session_date', startDateStr)
        .lte('session_date', endDateStr);

      if (sessionError) {
        console.error(`Error fetching sessions for ${vaccine.name}:`, sessionError);
        continue;
      }

      // Calculate totals from sessions across all barangays
      const totalAdministered = sessions?.reduce((sum, s) => sum + (s.administered || 0), 0) || 0;
      const totalTarget = sessions?.reduce((sum, s) => sum + (s.target || 0), 0) || 0;

      console.log(`  Sessions found: ${sessions?.length || 0}`);
      console.log(`  Administered: ${totalAdministered}, Target: ${totalTarget}`);

      // Get initial inventory from previous month's ending inventory
      // Calculate previous month
      const previousMonth = new Date(monthDate);
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const previousMonthStr = previousMonth.toISOString().split('T')[0].substring(0, 7) + '-01';
      
      // Try to get previous month's report from database
      let initialVials = 0;
      const { data: prevMonthReport, error: prevMonthError } = await supabase
        .from('vaccine_monthly_report')
        .select('ending_inventory')
        .eq('vaccine_id', vaccine.id)
        .eq('month', previousMonthStr)
        .single();
      
      if (!prevMonthError && prevMonthReport) {
        // Use previous month's ending as this month's initial
        initialVials = prevMonthReport.ending_inventory || 0;
        console.log(`  Initial inventory (from previous month ending): ${initialVials} vials`);
      } else {
        // Fallback: Get initial inventory from vaccines created BEFORE this month
        const { data: vaccinesBeforeMonth, error: vaccineDetailError } = await supabase
          .from('vaccines')
          .select('quantity_available, created_at')
          .eq('id', vaccine.id)
          .lt('created_at', startDateStr);

        if (vaccineDetailError) {
          console.error(`Error fetching vaccine details:`, vaccineDetailError);
          continue;
        }

        // Sum up all quantities from vaccines created BEFORE this month
        if (vaccinesBeforeMonth && vaccinesBeforeMonth.length > 0) {
          initialVials = vaccinesBeforeMonth.reduce((sum, v) => sum + (v.quantity_available || 0), 0);
        }
        
        console.log(`  Initial inventory (vaccines created before ${month}): ${initialVials} vials`);
      }
      
      // Get current month's sessions to calculate how much was administered this month
      const { data: currentSessions, error: currentSessionError } = await supabase
        .from('vaccination_sessions')
        .select('administered')
        .eq('vaccine_id', vaccine.id)
        .gte('session_date', startDateStr)
        .lte('session_date', endDateStr);
      
      if (!currentSessionError && currentSessions && currentSessions.length > 0) {
        // Calculate total administered this month
        const currentAdministered = currentSessions.reduce((sum, s) => sum + (s.administered || 0), 0) || 0;
        console.log(`  Administered this month: ${currentAdministered} vials`);
      }

      // Calculate total quantity supplied (IN) during the month
      // This represents NEW stock that was added/received during the month
      // Check vaccines table for items created during this month
      const { data: newVaccines, error: newVaccineError } = await supabase
        .from('vaccines')
        .select('quantity_available, created_at')
        .eq('id', vaccine.id)
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      let quantitySupplied = 0;
      if (!newVaccineError && newVaccines && newVaccines.length > 0) {
        // Sum up all quantities from vaccines created during this month
        quantitySupplied = newVaccines.reduce((sum, v) => sum + (v.quantity_available || 0), 0);
      }
      console.log(`  Quantity Supplied (IN): ${quantitySupplied} vials (from vaccines created this month)`);

      // Get total current inventory for this vaccine across all barangays
      const { data: inventory, error: inventoryError } = await supabase
        .from('barangay_vaccine_inventory')
        .select('quantity_vial, quantity_dose')
        .eq('vaccine_id', vaccine.id);

      if (inventoryError) {
        console.error(`Error fetching inventory:`, inventoryError);
        continue;
      }

      const currentVials = inventory?.reduce((sum, i) => sum + (i.quantity_vial || 0), 0) || 0;
      const currentDoses = inventory?.reduce((sum, i) => sum + (i.quantity_dose || 0), 0) || 0;

      console.log(`  Current inventory: ${currentVials} vials, ${currentDoses} doses`);

      // Get Monthly Vials Needed from NIP reference table
      const monthlyVialsNeeded = getMonthlyVialsNeeded(vaccine.name);
      console.log(`  Monthly Vials Needed: ${monthlyVialsNeeded} vials`);
      
      // Get Max Allocation (Buffer + 1 month) from NIP reference table
      const maxAllocation = getMaxAllocation(vaccine.name);
      console.log(`  Max Allocation: ${maxAllocation} vials`);
      
      // Calculate ending inventory using NIP formula
      // Ending = Initial + IN - OUT - Wastage
      const endingInventory = initialVials + quantitySupplied - totalAdministered - 0; // 0 = wastage (default)
      
      // Calculate stock percentage based on NIP formula
      // Stock % = (Ending Inventory / Max Allocation) × 100
      // Store raw value (not capped) for database
      const stockPercentage = maxAllocation > 0 ? Math.round((endingInventory / maxAllocation) * 100) : 0;
      console.log(`  Stock %: (${endingInventory} / ${maxAllocation}) × 100 = ${stockPercentage}%`);

      // Determine status based on NIP stock levels
      let status = 'GOOD';
      if (stockPercentage === 0) status = 'STOCKOUT';
      else if (stockPercentage < 25) status = 'STOCKOUT';
      else if (stockPercentage < 50) status = 'UNDERSTOCK';
      else if (stockPercentage > 75) status = 'OVERSTOCK';
      else status = 'GOOD';

      // Use vaccine name as key to merge duplicates
      const vaccineKey = vaccine.name.toLowerCase().trim();
      
      if (reportMap.has(vaccineKey)) {
        // Merge with existing vaccine entry using NIP formula
        console.log(`  ⚠️ Duplicate vaccine found: ${vaccine.name}, merging data...`);
        const existing = reportMap.get(vaccineKey);
        existing.initial_inventory += initialVials;
        existing.quantity_supplied += quantitySupplied; // Add IN from new supply
        existing.quantity_used += totalAdministered;
        existing.ending_inventory = existing.initial_inventory + existing.quantity_supplied - existing.quantity_used - existing.quantity_wastage; // Initial + IN - OUT - Wastage
        // vials_needed and max_allocation stay the same (fixed from NIP table)
        // Recalculate stock percentage: (Ending Inventory / Max Allocation) × 100
        existing.stock_level_percentage = existing.max_allocation > 0 
          ? Math.round((existing.ending_inventory / existing.max_allocation) * 100) 
          : 0;
        // Update status based on NIP levels
        if (existing.stock_level_percentage === 0) existing.status = 'STOCKOUT';
        else if (existing.stock_level_percentage < 25) existing.status = 'STOCKOUT';
        else if (existing.stock_level_percentage < 50) existing.status = 'UNDERSTOCK';
        else if (existing.stock_level_percentage > 75) existing.status = 'OVERSTOCK';
        else existing.status = 'GOOD';
      } else {
        // Create new report record for vaccine using NIP formula
        const endingInventoryCalc = initialVials + quantitySupplied - totalAdministered;
        const report = {
          id: `${vaccine.id}-${month}`,
          vaccine_id: vaccine.id,
          month: month,
          initial_inventory: initialVials,
          quantity_supplied: quantitySupplied, // IN: New stock added during month
          quantity_used: totalAdministered,
          quantity_wastage: 0,
          ending_inventory: endingInventoryCalc, // Initial + IN - OUT - Wastage
          vials_needed: monthlyVialsNeeded, // Monthly Vials Needed from NIP table
          max_allocation: maxAllocation, // Max Allocation (Buffer + 1 month) from NIP table
          stock_level_percentage: stockPercentage,
          status: status,
          vaccine: {
            id: vaccine.id,
            name: vaccine.name,
            batch_number: vaccine.batch_number
          }
        };
        reportMap.set(vaccineKey, report);
      }
    }

    // Convert Map to array
    const reports = Array.from(reportMap.values());

    console.log(`✅ Monthly report calculated: ${reports.length} unique vaccines (duplicates merged)`);
    
    // Save reports to Supabase (disabled)
    // await saveMonthlyReportsToSupabase(reports, month);
    
    return { data: reports, error: null };
  } catch (err) {
    console.error('Error in fetchMonthlyVaccineReport:', err);
    return { data: [], error: err };
  }
}

/**
 * Save monthly reports to Supabase database
 * @param {Array} reports - Array of monthly report records
 * @param {string} month - Month in YYYY-MM-01 format
 */
async function saveMonthlyReportsToSupabase(reports, month) {
  try {
    if (!reports || reports.length === 0) {
      console.log('No reports to save');
      return;
    }

    // Prepare data for insertion
    const reportsToSave = reports.map(report => ({
      vaccine_id: report.vaccine_id,
      month: month,
      initial_inventory: report.initial_inventory,
      quantity_supplied: report.quantity_supplied,
      quantity_used: report.quantity_used,
      quantity_wastage: report.quantity_wastage,
      ending_inventory: report.ending_inventory,
      vials_needed: report.vials_needed,
      max_allocation: report.max_allocation,
      stock_level_percentage: report.stock_level_percentage,
      status: report.status
    }));

    try {
      // Delete existing records for this month first
      const { error: deleteError } = await supabase
        .from('vaccine_monthly_report')
        .delete()
        .eq('month', month);

      if (deleteError) {
        console.warn('⚠️ Could not delete existing records:', deleteError.message);
      }

      // Insert new records
      const { data, error } = await supabase
        .from('vaccine_monthly_report')
        .insert(reportsToSave)
        .select();

      if (error) {
        console.error('❌ Error saving monthly reports to Supabase:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        
        // Log the data being sent for debugging
        console.log('📝 Data being saved:', JSON.stringify(reportsToSave, null, 2));
      } else {
        console.log(`✅ Saved ${reportsToSave.length} monthly reports to Supabase for month ${month}`);
      }
    } catch (insertErr) {
      console.error('❌ Exception during save:', insertErr);
    }
  } catch (err) {
    console.error('Error in saveMonthlyReportsToSupabase:', err);
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
 * Get all months with vaccination session data
 * @param {string} barangayId - Barangay ID (optional)
 * @returns {Promise<{data: Array, error: Object|null}>}
 */
export async function getAvailableMonths(barangayId) {
  try {
    console.log('Fetching available months from vaccination sessions');
    
    // Get all vaccination sessions to determine available months
    let query = supabase
      .from('vaccination_sessions')
      .select('session_date');
    
    // Filter by barangay if provided
    if (barangayId) {
      query = query.eq('barangay_id', barangayId);
    }
    
    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      return { data: [], error };
    }

    // Extract unique months from session dates
    const uniqueMonths = new Set();
    
    if (sessions && Array.isArray(sessions)) {
      for (const session of sessions) {
        if (session.session_date) {
          // Extract YYYY-MM-01 format
          const monthStr = session.session_date.substring(0, 7) + '-01';
          uniqueMonths.add(monthStr);
        }
      }
    }

    // Convert to array and sort descending
    const monthsArray = Array.from(uniqueMonths)
      .map(month => ({ month }))
      .sort((a, b) => new Date(b.month) - new Date(a.month));

    console.log('Available months:', monthsArray);
    return { data: monthsArray, error: null };
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
