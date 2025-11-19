'use client';

import { supabase } from '@/lib/supabase';

/**
 * Syncs barangay data when adding inventory
 * If barangay doesn't exist in barangays table, it creates it
 */
export async function syncBarangayToTable(barangayCode, barangayName) {
  try {
    // Check if barangay already exists
    const { data: existing, error: checkError } = await supabase
      .from('barangays')
      .select('id')
      .eq('code', barangayCode)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected
      console.error('Error checking barangay:', checkError);
      return false;
    }

    // If barangay doesn't exist, create it
    if (!existing) {
      const { error: insertError } = await supabase
        .from('barangays')
        .insert([
          {
            code: barangayCode,
            name: barangayName || barangayCode
          }
        ]);

      if (insertError) {
        console.error('Error syncing barangay:', insertError);
        return false;
      }

      console.log(`Barangay synced: ${barangayName} (${barangayCode})`);
      return true;
    }

    // Barangay already exists
    return true;
  } catch (err) {
    console.error('Sync error:', err);
    return false;
  }
}

/**
 * Add inventory and sync barangay
 */
export async function addInventoryWithSync(inventoryData) {
  try {
    // First, sync the barangay
    if (inventoryData.barangay) {
      await syncBarangayToTable(inventoryData.barangay, inventoryData.barangay_name);
    }

    // Then add the inventory
    const { data, error } = await supabase
      .from('inventory')
      .insert([inventoryData])
      .select();

    if (error) throw error;

    console.log('Inventory added and barangay synced');
    return { success: true, data };
  } catch (err) {
    console.error('Error adding inventory:', err);
    return { success: false, error: err.message };
  }
}
