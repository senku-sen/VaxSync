import { supabase } from "./supabase";
import { getDosesPerVial } from "./vaccineVialMapping";

/**
 * Cache for monthly reports to avoid recalculation
 * Structure: { "2025-12-01": { vaccine_id: { ending_inventory: 1200, ... } } }
 */
const monthlyReportCache = {};

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
 * Update monthly report OUT column when administered count changes
 * Called when vaccination session administered count is updated
 * @param {string} vaccineId - Vaccine ID
 * @param {number} administeredDifference - Change in administered count (positive or negative)
 * @param {string} sessionDate - Session date (YYYY-MM-DD format)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function updateMonthlyReportOutCount(vaccineId, administeredDifference, sessionDate) {
  try {
    console.log('📊 Updating monthly report OUT count:', { vaccineId, administeredDifference, sessionDate });

    // Get month from session date
    const sessionDateObj = new Date(sessionDate);
    const month = `${sessionDateObj.getFullYear()}-${String(sessionDateObj.getMonth() + 1).padStart(2, '0')}-01`;
    
    console.log(`📅 Session month: ${month}`);

    // Get current report entry
    const { data: report, error: fetchError } = await supabase
      .from('VaccineMonthlyReport')
      .select('id, quantity_used, ending_inventory, max_allocation')
      .eq('vaccine_id', vaccineId)
      .eq('month', month)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching report:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!report) {
      console.warn('⚠️ No monthly report entry found for this vaccine/month');
      return { success: false, error: 'No monthly report entry found' };
    }

    // Calculate new OUT and Ending values
    const newQuantityUsed = Math.max(0, (report.quantity_used || 0) + administeredDifference);
    const newEndingInventory = Math.max(0, (report.ending_inventory || 0) - administeredDifference);
    const newStockPercentage = report.max_allocation > 0 
      ? Math.round((newEndingInventory / report.max_allocation) * 100) 
      : 0;

    console.log('📝 Updating report:', {
      old_out: report.quantity_used,
      new_out: newQuantityUsed,
      old_ending: report.ending_inventory,
      new_ending: newEndingInventory,
      new_stock_percentage: newStockPercentage
    });

    // Update the report
    const { error: updateError } = await supabase
      .from('VaccineMonthlyReport')
      .update({
        quantity_used: newQuantityUsed,
        ending_inventory: newEndingInventory,
        stock_level_percentage: newStockPercentage,
        status: newStockPercentage === 0 ? 'STOCKOUT' : newStockPercentage < 25 ? 'STOCKOUT' : newStockPercentage < 50 ? 'UNDERSTOCK' : newStockPercentage > 75 ? 'OVERSTOCK' : 'GOOD',
        updated_at: new Date().toISOString()
      })
      .eq('id', report.id);

    if (updateError) {
      console.error('Error updating monthly report:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('✅ Monthly report OUT updated:', {
      quantity_used: newQuantityUsed,
      ending_inventory: newEndingInventory,
      stock_percentage: newStockPercentage
    });

    return { success: true, error: null };
  } catch (err) {
    console.error('Error in updateMonthlyReportOutCount:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Auto-create monthly report entry when vaccine is added
 * Called when a new vaccine is added to inventory
 * @param {string} vaccineId - Vaccine ID
 * @param {string} vaccineName - Vaccine name
 * @param {number} quantity - Quantity added
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function createMonthlyReportEntryForVaccine(vaccineId, vaccineName, quantity) {
  try {
    console.log('📊 Creating monthly report entry for vaccine:', { vaccineId, vaccineName, quantity });

    // Get current month
    const today = new Date();
    const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    
    console.log(`📅 Current month: ${month}`);

    // Check if entry already exists for this vaccine this month
    const { data: existingReport, error: checkError } = await supabase
      .from('VaccineMonthlyReport')
      .select('id, quantity_supplied, ending_inventory')
      .eq('vaccine_id', vaccineId)
      .eq('month', month)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing report:', checkError);
      return { success: false, error: checkError.message };
    }

    // Get NIP reference values
    const monthlyVialsNeeded = getMonthlyVialsNeeded(vaccineName);
    const maxAllocation = getMaxAllocation(vaccineName);

    if (existingReport) {
      // UPDATE: Add to existing entry's IN column
      console.log('📝 Updating existing monthly report entry...');
      
      const newQuantitySupplied = (existingReport.quantity_supplied || 0) + quantity;
      const newEndingInventory = (existingReport.ending_inventory || 0) + quantity;
      const newStockPercentage = maxAllocation > 0 
        ? Math.round((newEndingInventory / maxAllocation) * 100) 
        : 0;

      const { error: updateError } = await supabase
        .from('VaccineMonthlyReport')
        .update({
          quantity_supplied: newQuantitySupplied,
          ending_inventory: newEndingInventory,
          stock_level_percentage: newStockPercentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReport.id);

      if (updateError) {
        console.error('Error updating monthly report:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('✅ Monthly report entry updated:', {
        quantity_supplied: newQuantitySupplied,
        ending_inventory: newEndingInventory,
        stock_percentage: newStockPercentage
      });
    } else {
      // CREATE: New entry
      console.log('✨ Creating new monthly report entry...');

      const stockPercentage = maxAllocation > 0 
        ? Math.round((quantity / maxAllocation) * 100) 
        : 0;

      const { error: insertError } = await supabase
        .from('VaccineMonthlyReport')
        .insert([{
          vaccine_id: vaccineId,
          month: month,
          initial_inventory: 0,
          quantity_supplied: quantity,  // IN: New vaccine added
          quantity_used: 0,              // OUT: None yet
          quantity_wastage: 0,
          ending_inventory: quantity,
          vials_needed: monthlyVialsNeeded,
          max_allocation: maxAllocation,
          stock_level_percentage: stockPercentage,
          status: stockPercentage === 0 ? 'STOCKOUT' : stockPercentage < 25 ? 'STOCKOUT' : stockPercentage < 50 ? 'UNDERSTOCK' : stockPercentage > 75 ? 'OVERSTOCK' : 'GOOD'
        }]);

      if (insertError) {
        console.error('Error creating monthly report:', insertError);
        return { success: false, error: insertError.message };
      }

      console.log('✅ Monthly report entry created:', {
        vaccine: vaccineName,
        month: month,
        quantity_supplied: quantity,
        ending_inventory: quantity,
        stock_percentage: stockPercentage
      });
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error in createMonthlyReportEntryForVaccine:', err);
    return { success: false, error: err.message };
  }
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
    // Month format: "2025-12-01" - extract year and month
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr);
    const monthNum = parseInt(monthStr) - 1; // JavaScript months are 0-indexed
    
    // Create dates using local timezone to avoid UTC conversion issues
    const startDate = new Date(year, monthNum, 1);
    const endDate = new Date(year, monthNum + 1, 0);
    
    const startDateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-01`;
    const endDateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    
    // For timestamp comparisons (updated_at), use ISO format with time
    const startDateTimeStr = new Date(year, monthNum, 1, 0, 0, 0).toISOString();
    const endDateTimeStr = new Date(year, monthNum + 1, 0, 23, 59, 59).toISOString();
    
    console.log(`📅 Date range: ${startDateStr} to ${endDateStr}`);

    // Get all vaccines that have activity (sessions or requests) DURING this month
    // Trace: vaccines → vaccine_doses → vaccination_sessions
    
    // Step 1: Get all vaccine_doses with their vaccine_id
    const { data: allVaccineDoses, error: dosesError } = await supabase
      .from('VaccineDoses')
      .select('*');
    
    console.log(`📋 Loaded vaccine_doses: ${allVaccineDoses?.length || 0} records`);
    if (dosesError) {
      console.error('Error loading vaccine_doses:', dosesError);
    }
    
    // Create mapping: vaccine_doses.id → vaccines.id
    const vaccineDosesMap = new Map();
    if (allVaccineDoses) {
      allVaccineDoses.forEach(vd => {
        vaccineDosesMap.set(vd.id, { vaccine_id: vd.vaccine_id, doses_per_vial: vd.doses_per_vial });
      });
    }
    
    // Step 2: Get sessions this month and map to vaccines
    const { data: sessionVaccines, error: sessionVaccineError } = await supabase
      .from('VaccinationSessions')
      .select('vaccine_id')
      .gte('session_date', startDateStr)
      .lte('session_date', endDateStr);

    // Step 3: Get vaccines with requests this month
    const { data: requestVaccines, error: requestVaccineError } = await supabase
      .from('VaccineRequests')
      .select('vaccine_id')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);

    // Step 4: Combine unique vaccine IDs by resolving vaccine_doses.id → vaccines.id
    const vaccineIds = new Set();
    if (sessionVaccines) {
      sessionVaccines.forEach(sv => {
        const dosesInfo = vaccineDosesMap.get(sv.vaccine_id);
        if (dosesInfo) {
          vaccineIds.add(dosesInfo.vaccine_id);
        }
      });
    }
    if (requestVaccines) requestVaccines.forEach(rv => vaccineIds.add(rv.vaccine_id));

    // Step 5: Get vaccine details for all these IDs
    const { data: vaccines, error: vaccineError } = await supabase
      .from('Vaccines')
      .select('id, name, batch_number, created_at')
      .in('id', Array.from(vaccineIds));

    if (vaccineError) {
      console.error('Error fetching vaccines:', vaccineError);
      return { data: [], error: vaccineError };
    }
    
    console.log(`📦 Found ${vaccines?.length || 0} vaccines with activity in ${month}`);

    const reportMap = new Map(); // Use Map to merge duplicates by vaccine name

    // For each vaccine CREATED THIS MONTH, calculate aggregated data across ALL barangays
    for (const vaccine of vaccines) {
      console.log(`\n🔍 Processing: ${vaccine.name} (batch: ${vaccine.batch_number})`);

      // Get ALL vaccination sessions for this month
      const { data: allSessions, error: allSessionsError } = await supabase
        .from('VaccinationSessions')
        .select('id, vaccine_id, administered, target, session_date')
        .gte('session_date', startDateStr)
        .lte('session_date', endDateStr);

      if (allSessionsError) {
        console.error(`Error fetching sessions:`, allSessionsError);
        continue;
      }

      console.log(`  📊 Total sessions in month: ${allSessions?.length || 0}`);

      // Calculate OUT: Get administered from all sessions and match by vaccine batch number
      let totalOut = 0;
      
      if (allSessions && allSessions.length > 0) {
        for (const session of allSessions) {
          // session.vaccine_id is barangay_vaccine_inventory.id
          // Get the vaccine_doses.id from barangay_vaccine_inventory
          const { data: inventoryData, error: invError } = await supabase
            .from('BarangayVaccineInventory')
            .select('vaccine_id')
            .eq('id', session.vaccine_id)
            .single();

          if (invError || !inventoryData) {
            console.log(`    ❌ Session ${session.id}: Could not find barangay_vaccine_inventory`);
            continue;
          }

          // inventoryData.vaccine_id is vaccine_doses.id
          // Get the actual vaccines.id from vaccine_doses
          const { data: dosesData, error: dosesError } = await supabase
            .from('VaccineDoses')
            .select('vaccine_id')
            .eq('id', inventoryData.vaccine_id)
            .single();

          if (dosesError || !dosesData) {
            console.log(`    ❌ Session ${session.id}: Could not find vaccine_doses`);
            continue;
          }

          // Now get the vaccine record using the actual vaccine_id
          const { data: sessionVaccine, error: vaccineError } = await supabase
            .from('Vaccines')
            .select('id, batch_number, name')
            .eq('id', dosesData.vaccine_id)
            .single();

          if (vaccineError || !sessionVaccine) {
            console.log(`    ❌ Session ${session.id}: Could not find vaccine for vaccine_id: ${dosesData.vaccine_id}`);
            continue;
          }

          console.log(`    🔎 Session ${session.id}: vaccine=${sessionVaccine.name} (batch: ${sessionVaccine.batch_number}), administered=${session.administered}`);

          // Match by batch number with current vaccine
          if (sessionVaccine.batch_number === vaccine.batch_number) {
            console.log(`      ✅ BATCH MATCH! ${sessionVaccine.batch_number} === ${vaccine.batch_number}`);
            
            // Get doses per vial for this vaccine using the function
            const dosesPerVial = getDosesPerVial(vaccine.name) || 1;
            const administeredDoses = (session.administered || 0) * dosesPerVial;
            
            totalOut += administeredDoses;
            console.log(`      📊 Adding: ${session.administered} vials × ${dosesPerVial} doses/vial = ${administeredDoses} doses`);
          } else {
            console.log(`      ❌ Batch mismatch: ${sessionVaccine.batch_number} !== ${vaccine.batch_number}`);
          }
        }
      }

      console.log(`  ✅ Total OUT (Administered): ${totalOut} doses`);

      // Get initial inventory from previous month's ending inventory
      // Calculate previous month based on parsed year/month (avoid using monthDate)
      const previousMonthDate = new Date(year, monthNum - 1, 1);
      const previousYear = previousMonthDate.getFullYear();
      const previousMonthNumber = previousMonthDate.getMonth() + 1; // 1-12
      const previousMonthStr = `${previousYear}-${String(previousMonthNumber).padStart(2, '0')}-01`;
      
      let initialDoses = 0;
      
      // Step 1: Try cache first (fastest)
      if (monthlyReportCache[previousMonthStr] && monthlyReportCache[previousMonthStr][vaccine.id]) {
        initialDoses = monthlyReportCache[previousMonthStr][vaccine.id].ending_inventory || 0;
        console.log(`  ✅ Initial inventory (from cache): ${initialDoses} doses`);
      } 
      // Step 2: Try database (fast) - with error suppression
      else {
        try {
          // Query for previous month's report
          console.log(`  🔍 Looking for previous month (${previousMonthStr}) in database...`);
          const { data: prevMonthReport, error: prevMonthError } = await supabase
            .from('VaccineMonthlyReport')
            .select('ending_inventory, vaccine_id, month')
            .eq('vaccine_id', vaccine.id)
            .eq('month', previousMonthStr)
            .maybeSingle();
          
          // Only use if we got data and no error
          if (!prevMonthError && prevMonthReport && prevMonthReport.ending_inventory !== null) {
            initialDoses = prevMonthReport.ending_inventory || 0;
            console.log(`  ✅ Initial inventory (from database): ${initialDoses} doses for ${vaccine.name}`);
            // Cache it for next month
            if (!monthlyReportCache[previousMonthStr]) {
              monthlyReportCache[previousMonthStr] = {};
            }
            monthlyReportCache[previousMonthStr][vaccine.id] = { ending_inventory: initialDoses };
          } else {
            console.log(`  ⚠️ No previous month data found for ${vaccine.name} in ${previousMonthStr}`);
            // Fallback: Sum all inventory added BEFORE this month from barangay_vaccine_inventory
            const { data: inventoryBeforeMonth, error: beforeError } = await supabase
              .from('BarangayVaccineInventory')
              .select('quantity_dose, received_date')
              .eq('vaccine_id', vaccine.id)
              .lt('received_date', startDateStr);
            
            if (!beforeError && inventoryBeforeMonth && inventoryBeforeMonth.length > 0) {
              initialDoses = inventoryBeforeMonth.reduce((sum, inv) => sum + (inv.quantity_dose || 0), 0);
              console.log(`  ✅ Initial inventory (from barangay inventory before month): ${initialDoses} doses`);
            }
          }
        } catch (err) {
          console.warn(`  ⚠️ Database query error: ${err.message}`);
          // If error, keep initialVials = 0 and continue
        }
      }
      
      // Step 3: Also consider current barangay_vaccine_inventory quantity for this month start
      // Get inventory that existed at the START of this month (received before or on first day)
      const { data: inventoryAtMonthStart, error: monthStartError } = await supabase
        .from('BarangayVaccineInventory')
        .select('quantity_dose, received_date')
        .eq('vaccine_id', vaccine.id)
        .lt('received_date', startDateStr);
      
      if (!monthStartError && inventoryAtMonthStart && inventoryAtMonthStart.length > 0) {
        const inventoryAtStart = inventoryAtMonthStart.reduce((sum, inv) => sum + (inv.quantity_dose || 0), 0);
        console.log(`  📦 Current barangay inventory at month start: ${inventoryAtStart} doses`);
        // Use the maximum of previous month ending or current inventory at month start
        // This ensures we don't lose inventory if it wasn't properly recorded in previous month
        initialDoses = Math.max(initialDoses, inventoryAtStart);
        console.log(`  ✅ Initial inventory (adjusted with current barangay inventory): ${initialDoses} doses`);
      }
      
      // Get current month's sessions to calculate how much was administered this month
      const { data: currentSessions, error: currentSessionError } = await supabase
        .from('VaccinationSessions')
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
      // IN = Sum of doses added to barangay_vaccine_inventory DURING this month (from received_date)
      // + Sum of doses transferred via approved vaccine requests DURING this month
      // This represents actual stock that arrived/was added/transferred during the month
      const { data: inventoryAdditions, error: inventoryAddError } = await supabase
        .from('BarangayVaccineInventory')
        .select('quantity_dose, received_date')
        .eq('vaccine_id', vaccine.id)
        .gte('received_date', startDateStr)
        .lte('received_date', endDateStr);

      let quantitySupplied = 0;
      if (!inventoryAddError && inventoryAdditions && inventoryAdditions.length > 0) {
        // Sum all doses added to inventory DURING this month
        // These represent actual stock that arrived during the month
        quantitySupplied = inventoryAdditions.reduce((sum, inv) => sum + (inv.quantity_dose || 0), 0);
      }
      
      // Also add doses from approved vaccine requests DURING this month
      // Get all approved vaccine requests for this vaccine that were created during the month
      // Use the actual vaccine quantity_available from the vaccines table
      const { data: approvedRequests, error: requestError } = await supabase
        .from('VaccineRequests')
        .select('quantity_dose, created_at')
        .eq('vaccine_id', vaccine.id)
        .eq('status', 'approved')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);

      let quantityTransferred = 0;
      if (!requestError && approvedRequests && approvedRequests.length > 0) {
        // Sum all quantity_dose from approved vaccine requests in this month
        const requestedQuantity = approvedRequests.reduce((sum, req) => sum + (req.quantity_dose || 0), 0);
        
        // Get current vaccine quantity_available from vaccines table
        const { data: vaccineData, error: vaccineDataError } = await supabase
          .from('Vaccines')
          .select('quantity_available')
          .eq('id', vaccine.id)
          .single();
        
        const vaccineQuantity = (!vaccineDataError && vaccineData) ? (vaccineData.quantity_available || 0) : 0;
        
        // IN = quantity_dose from requests + quantity_available from vaccines table
        quantityTransferred = requestedQuantity + vaccineQuantity;
        console.log(`  Quantity from Vaccine Requests (approved in month): ${requestedQuantity} doses (from vaccine_requests.quantity_dose) + ${vaccineQuantity} doses (from vaccines.quantity_available) = ${quantityTransferred} doses`);
      }
      
      quantitySupplied += quantityTransferred;
      console.log(`  Quantity Supplied (IN): ${quantitySupplied} doses (from barangay inventory additions + vaccine request transfers this month)`);

      // Get total current inventory for this vaccine across all barangays
      const { data: inventory, error: inventoryError } = await supabase
        .from('BarangayVaccineInventory')
        .select('quantity_vial, quantity_dose')
        .eq('vaccine_id', vaccine.id);

      let currentVials = 0;
      let currentDoses = 0;
      if (!inventoryError && inventory) {
        currentVials = inventory.reduce((sum, i) => sum + (i.quantity_vial || 0), 0) || 0;
        currentDoses = inventory.reduce((sum, i) => sum + (i.quantity_dose || 0), 0) || 0;
      }

      console.log(`  Current inventory: ${currentVials} vials, ${currentDoses} doses`);

      // Get Monthly Vials Needed from NIP reference table
      const monthlyVialsNeeded = getMonthlyVialsNeeded(vaccine.name);
      console.log(`  Monthly Vials Needed: ${monthlyVialsNeeded} vials`);
      
      // Get Max Allocation (Buffer + 1 month) from NIP reference table
      const maxAllocation = getMaxAllocation(vaccine.name);
      console.log(`  Max Allocation: ${maxAllocation} vials`);
      
      // Calculate ending inventory
      // Ending = IN - OUT
      const endingInventory = quantitySupplied - totalOut;
      
      // Calculate stock percentage based on max allocation
      // Stock % = (Ending Inventory / Max Allocation) × 100
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
        // Merge with existing vaccine entry
        console.log(`  ⚠️ Duplicate vaccine found: ${vaccine.name}, merging data...`);
        const existing = reportMap.get(vaccineKey);
        existing.quantity_supplied += quantitySupplied; // IN
        existing.quantity_used += totalOut; // OUT
        existing.ending_inventory = existing.quantity_supplied - existing.quantity_used; // Ending = IN - OUT
        // Recalculate stock percentage: (Ending Inventory / Max Allocation) × 100
        existing.stock_level_percentage = (existing.max_allocation || 0) > 0 
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
        const report = {
          id: `${vaccine.id}-${month}`,
          vaccine_id: vaccine.id,
          month: month,
          initial_inventory: 0,
          quantity_supplied: quantitySupplied, // IN: New stock added during month
          quantity_used: totalOut,    // OUT: Doses administered
          quantity_wastage: 0,      // Wastage: Not tracked
          ending_inventory: endingInventory,   // Ending = IN - OUT
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
    
    // Cache the results for fast access on next month switch
    monthlyReportCache[month] = {};
    reports.forEach(report => {
      monthlyReportCache[month][report.vaccine_id] = {
        ending_inventory: report.ending_inventory,
        initial_inventory: report.initial_inventory,
        quantity_supplied: report.quantity_supplied,
        quantity_used: report.quantity_used,
        quantity_wastage: report.quantity_wastage
      };
    });
    console.log(`💾 Cached ${reports.length} reports for ${month}`);
    
    // Save reports to Supabase automatically
    await saveMonthlyReportsToSupabase(reports, month);
    
    return { data: reports, error: null };
  } catch (err) {
    console.error('Error in fetchMonthlyVaccineReport:', err);
    return { data: [], error: err };
  }
}

/**
 * Save monthly reports to Supabase database (Strategy 1: Batch UPSERT)
 * Single efficient batch operation for all reports
 * @param {Array} reports - Array of monthly report records
 * @param {string} month - Month in YYYY-MM-01 format
 */
async function saveMonthlyReportsToSupabase(reports, month) {
  try {
    if (!reports || reports.length === 0) {
      console.log('No reports to save');
      return;
    }

    console.log(`💾 Saving ${reports.length} monthly reports for ${month} (Batch UPSERT)...`);

    // Prepare data for batch upsert with validation
    const reportsToSave = reports.map(report => {
      // Ensure ending_inventory is never negative
      const endingInventory = Math.max(0, report.ending_inventory || 0);
      
      const recordToSave = {
        vaccine_id: report.vaccine_id,
        month: month,
        initial_inventory: Math.max(0, report.initial_inventory || 0),
        quantity_supplied: Math.max(0, report.quantity_supplied || 0),
        quantity_used: Math.max(0, report.quantity_used || 0),
        quantity_wastage: Math.max(0, report.quantity_wastage || 0),
        ending_inventory: endingInventory,
        vials_needed: Math.max(0, report.vials_needed || 0),
        max_allocation: Math.max(0, report.max_allocation || 0),
        stock_level_percentage: Math.max(0, report.stock_level_percentage || 0),
        status: report.status || 'GOOD'
      };
      
      // Debug log for first few records
      if (reports.indexOf(report) < 2) {
        console.log(`  📝 Saving: ${report.vaccine?.name || 'Unknown'} - Initial: ${recordToSave.initial_inventory}, IN: ${recordToSave.quantity_supplied}, OUT: ${recordToSave.quantity_used}, Ending: ${recordToSave.ending_inventory}`);
      }
      
      return recordToSave;
    });

    // Strategy 1: Batch UPSERT (single call, most efficient)
    const { data, error } = await supabase
      .from('VaccineMonthlyReport')
      .upsert(reportsToSave, { onConflict: 'vaccine_id,month' })
      .select();

    if (error) {
      console.error('❌ Batch UPSERT failed:', error.message);
      // Fallback: Try delete + insert
      console.log('🔄 Fallback: Trying delete + insert method...');
      await saveMonthlyReportsAlternative(reportsToSave, month);
    } else {
      console.log(`✅ Successfully saved ${data?.length || reportsToSave.length} monthly reports for ${month}`);
    }
  } catch (err) {
    console.error('Error in saveMonthlyReportsToSupabase:', err);
  }
}

/**
 * Alternative save method: Delete existing records and insert new ones
 * @param {Array} reportsToSave - Array of report records to save
 * @param {string} month - Month in YYYY-MM-01 format
 */
async function saveMonthlyReportsAlternative(reportsToSave, month) {
  try {
    console.log('🗑️ Deleting existing records for month:', month);
    
    // Delete existing records for this month
    const { error: deleteError } = await supabase
      .from('VaccineMonthlyReport')
      .delete()
      .eq('month', month);

    if (deleteError) {
      console.warn('⚠️ Delete error (continuing anyway):', deleteError.message);
    } else {
      console.log('✅ Deleted existing records');
    }

    // Insert new records
    console.log('📝 Inserting new records...');
    const { data, error: insertError } = await supabase
      .from('VaccineMonthlyReport')
      .insert(reportsToSave)
      .select();

    if (insertError) {
      console.error('❌ Insert error:', {
        message: insertError.message,
        code: insertError.code,
        status: insertError.status
      });
    } else {
      console.log(`✅ Successfully inserted ${data?.length || reportsToSave.length} records`);
    }
  } catch (err) {
    console.error('❌ Error in alternative save method:', err);
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
      .from('VaccineMonthlyReport')
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
        .from('VaccineMonthlyReport')
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
      .from('VaccineMonthlyReport')
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
      .from('VaccineMonthlyReport')
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
      .from('VaccineMonthlyReport')
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
      .from('VaccinationSessions')
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
