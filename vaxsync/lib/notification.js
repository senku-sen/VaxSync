import { supabase } from "./supabase";
import { getMaxAllocation, calculateStockPercentage } from "./vaccineMonthlyReport";

/**
 * Fetch vaccine request notifications for health worker
 * @param {string} userId - The user ID
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function fetchVaccineRequestNotifications(userId) {
  try {
    // Fetch all vaccine requests for this user
    let query = supabase
      .from("vaccine_requests")
      .select(`
        id,
        vaccine_id,
        barangay_id,
        status,
        quantity_dose,
        quantity_vial,
        notes,
        created_at,
        requested_at,
        vaccines(name),
        barangays(name)
      `)
      .order("created_at", { ascending: false });

    // Try to filter by requested_by if it exists
    if (userId) {
      query = query.eq("requested_by", userId);
    }

    let { data: requests, error: requestError } = await query;

    // If requested_by column doesn't exist, fetch all and filter client-side
    if (requestError && requestError.message && requestError.message.includes('requested_by')) {
      console.warn("requested_by column not found, fetching all requests...");
      const { data: allRequests, error: altError } = await supabase
        .from("vaccine_requests")
        .select(`
          id,
          vaccine_id,
          barangay_id,
          status,
          quantity_dose,
          quantity_vial,
          notes,
          created_at,
          requested_at,
          vaccines(name),
          barangays(name)
        `)
        .order("created_at", { ascending: false });
      
      if (altError) {
        // Only log error if we're actually online
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          console.error("Error fetching vaccine requests:", altError);
        }
        return { data: [], error: altError.message };
      }
      requests = allRequests;
      requestError = null;
    } else if (requestError) {
      // Only log error if we're actually online
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        console.error("Error fetching vaccine requests:", requestError);
      }
      return { data: [], error: requestError.message };
    }

    // Transform requests into notifications
    const notifications = requests.map((request) => {
      const statusMessages = {
        pending: {
          title: "Vaccine Request Pending",
          description: `Your request for ${request.vaccines?.name || "vaccine"} is awaiting approval`,
          icon: "pending",
          color: "yellow",
        },
        approved: {
          title: "Vaccine Request Approved ✓",
          description: `Your request for ${request.vaccines?.name || "vaccine"} has been approved by Head Nurse`,
          icon: "approved",
          color: "green",
        },
        rejected: {
          title: "Vaccine Request Rejected",
          description: `Your request for ${request.vaccines?.name || "vaccine"} has been rejected`,
          icon: "rejected",
          color: "red",
        },
        released: {
          title: "Vaccine Request Released",
          description: `Your request for ${request.vaccines?.name || "vaccine"} has been released to inventory`,
          icon: "released",
          color: "blue",
        },
      };

      const statusInfo = statusMessages[request.status] || statusMessages.pending;

      return {
        id: request.id,
        type: "vaccine-request",
        title: statusInfo.title,
        description: statusInfo.description,
        vaccineName: request.vaccines?.name || "Unknown Vaccine",
        barangayName: request.barangays?.name || "Unknown Barangay",
        quantity: `${request.quantity_dose} doses${request.quantity_vial ? ` / ${request.quantity_vial} vials` : ""}`,
        status: request.status,
        requestId: request.id,
        timestamp: request.requested_at || request.created_at,
        date: new Date(request.requested_at || request.created_at),
        read: false,
        archived: false,
        icon: statusInfo.icon,
        color: statusInfo.color,
        notes: request.notes,
      };
    });

    return { data: notifications, error: null };
  } catch (err) {
    console.error("Error in fetchVaccineRequestNotifications:", err);
    return { data: [], error: err.message };
  }
}

/**
 * Get status badge color for notifications
 * @param {string} status - The vaccine request status
 * @returns {string} - Tailwind CSS classes
 */
export function getStatusBadgeColor(status) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "approved":
      return "bg-green-100 text-green-700 border-green-200";
    case "rejected":
      return "bg-red-100 text-red-700 border-red-200";
    case "released":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

/**
 * Get status icon background color
 * @param {string} status - The vaccine request status
 * @returns {string} - Tailwind CSS classes
 */
export function getStatusIconBgColor(status) {
  switch (status) {
    case "pending":
      return "bg-yellow-100";
    case "approved":
      return "bg-green-100";
    case "rejected":
      return "bg-red-100";
    case "released":
      return "bg-blue-100";
    default:
      return "bg-gray-100";
  }
}

/**
 * Get status icon color
 * @param {string} status - The vaccine request status
 * @returns {string} - Tailwind CSS classes
 */
export function getStatusIconColor(status) {
  switch (status) {
    case "pending":
      return "text-yellow-600";
    case "approved":
      return "text-green-600";
    case "rejected":
      return "text-red-600";
    case "released":
      return "text-blue-600";
    default:
      return "text-gray-600";
  }
}

/**
 * Format timestamp for display
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} - Formatted timestamp
 */
export function formatNotificationTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Subscribe to real-time vaccine request updates
 * @param {string} userId - The user ID (null for admins to see all)
 * @param {Function} callback - Callback function when updates occur
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToVaccineRequestUpdates(userId, callback) {
  const channelName = userId ? `vaccine_requests_${userId}` : `vaccine_requests_all_${Date.now()}`;
  
  const subscriptionConfig = {
    event: "*",
    schema: "public",
    table: "vaccine_requests",
  };
  
  // Only add filter if userId is provided
  if (userId) {
    subscriptionConfig.filter = `requested_by=eq.${userId}`;
  }
  
  const subscription = supabase
    .channel(channelName)
    .on("postgres_changes", subscriptionConfig, (payload) => {
      console.log("🔔 Vaccine request update received:", payload);
      callback(payload);
    })
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * FEATURE 1: Fetch resident approval notifications
 * @param {string} userId - The user ID (Health Worker)
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function fetchResidentApprovalNotifications(userId) {
  try {
    // If no userId provided (PHN/admin), fetch all; otherwise filter by submitted_by
    let query = supabase
      .from("residents")
      .select(`
        id,
        name,
        vaccine_status,
        status,
        barangay,
        submitted_at,
        updated_at
      `)
      .order("submitted_at", { ascending: false });

    if (userId) {
      query = query.eq("submitted_by", userId);
    }

    const { data: residents, error: residentError } = await query;

    if (residentError) {
      // Return empty gracefully; log for debugging
      console.error("Error fetching resident notifications:", residentError);
      return { data: [], error: residentError.message || residentError };
    }

    // Transform residents into notifications
    const notifications = residents.map((resident) => {
      const statusMessages = {
        pending: {
          title: "Resident Approval Pending",
          description: `${resident.name} is awaiting approval`,
          icon: "pending",
          color: "yellow",
        },
        approved: {
          title: "Resident Approved ✓",
          description: `${resident.name} has been approved by Head Nurse`,
          icon: "approved",
          color: "green",
        },
        rejected: {
          title: "Resident Rejected",
          description: `${resident.name} has been rejected`,
          icon: "rejected",
          color: "red",
        },
      };

      const statusInfo = statusMessages[resident.status] || statusMessages.pending;

      return {
        id: resident.id,
        type: "resident-approval",
        title: statusInfo.title,
        description: statusInfo.description,
        residentName: resident.name,
        barangay: resident.barangay,
        vaccineStatus: resident.vaccine_status,
        status: resident.status,
        timestamp: resident.submitted_at || resident.updated_at,
        date: new Date(resident.submitted_at || resident.updated_at),
        read: false,
        archived: false,
        icon: statusInfo.icon,
        color: statusInfo.color,
      };
    });

    return { data: notifications, error: null };
  } catch (err) {
    // Only log error if we're actually online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      console.error("Error in fetchResidentApprovalNotifications:", err);
    }
    return { data: [], error: err.message };
  }
}

/**
 * FEATURE 3: Fetch vaccination session notifications
 * @param {string} userId - The user ID
 * @param {string} barangayId - The barangay ID (for Health Workers)
 * @param {boolean} isAdmin - If true, fetch all sessions (for Head Nurse)
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function fetchVaccinationSessionNotifications(userId, barangayId = null, isAdmin = false) {
  try {
    let query = supabase
      .from("vaccination_sessions")
      .select(`
        id,
        vaccine_id,
        barangay_id,
        session_date,
        session_time,
        target,
        administered,
        status,
        created_at,
        barangays(name)
      `)
      .order("session_date", { ascending: true });

    // Filter by barangay for Health Workers
    if (!isAdmin && barangayId) {
      query = query.eq("barangay_id", barangayId);
    }

    const { data: sessions, error: sessionError } = await query;

    if (sessionError) {
      // Only log error if we're actually online
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        console.error("Error fetching session notifications:", sessionError);
      }
      return { data: [], error: sessionError.message };
    }

    // Build a vaccine map so we can show human-readable names
    const vaccineIds = Array.from(
      new Set(
        sessions
          .map((s) => s.vaccine_id)
          .filter((id) => id && id.length > 0)
      )
    );

    let vaccineMap = {};
    if (vaccineIds.length > 0) {
      const { data: vaccines, error: vaccineError } = await supabase
        .from("vaccines")
        .select("id, name, doses")
        .in("id", vaccineIds);

      if (vaccineError) {
        console.error("Error fetching vaccines:", vaccineError);
      } else if (Array.isArray(vaccines)) {
        vaccineMap = Object.fromEntries(vaccines.map((v) => [v.id, v]));
      }
    }

    // Transform sessions into notifications
    const notifications = sessions.map((session) => {
      const sessionDate = new Date(session.session_date);
      const now = new Date();
      const daysUntil = Math.ceil((sessionDate - now) / (1000 * 60 * 60 * 24));
      const isUpcoming = daysUntil > 0 && daysUntil <= 1;
      const isOverdue = daysUntil < 0;

      const vaccine = vaccineMap[session.vaccine_id] || null;
      const vaccineName = vaccine?.name || "Unknown Vaccine";
      const doses = vaccine?.doses || 10;
      const vaccineDisplay = `${vaccineName} (${doses} doses)`;
      
      const statusMessages = {
        scheduled: {
          title: isUpcoming ? "Upcoming Vaccination Session" : "Scheduled Session",
          description: `${vaccineName} session on ${sessionDate.toLocaleDateString()}`,
          icon: "scheduled",
          color: "blue",
        },
        "in-progress": {
          title: "Session In Progress",
          description: `${vaccineName} session is currently active`,
          icon: "in-progress",
          color: "yellow",
        },
        completed: {
          title: "Session Completed",
          description: `${vaccineName} session completed with ${session.administered}/${session.target} vaccinations`,
          icon: "completed",
          color: "green",
        },
      };

      const statusInfo = statusMessages[session.status] || statusMessages.scheduled;

      return {
        id: session.id,
        type: "vaccination-session",
        title: statusInfo.title,
        description: statusInfo.description,
        vaccineName: vaccineDisplay,
        barangayName: session.barangays?.name || "Unknown Barangay",
        sessionDate: sessionDate.toLocaleDateString(),
        sessionTime: session.session_time,
        target: session.target,
        administered: session.administered,
        progress: Math.round((session.administered / session.target) * 100),
        status: session.status,
        daysUntil,
        isUpcoming,
        isOverdue,
        timestamp: session.created_at,
        date: new Date(session.created_at),
        read: false,
        archived: false,
        icon: statusInfo.icon,
        color: statusInfo.color,
      };
    });

    return { data: notifications, error: null };
  } catch (err) {
    console.error("Error in fetchVaccinationSessionNotifications:", err);
    return { data: [], error: err.message };
  }
}

/**
 * Subscribe to real-time resident approval updates
 * @param {string} userId - The user ID
 * @param {Function} callback - Callback function when updates occur
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToResidentUpdates(userId, callback) {
  const subscription = supabase
    .channel(`residents_${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "residents",
        filter: `submitted_by=eq.${userId}`,
      },
      (payload) => {
        console.log("Resident update received:", payload);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * Subscribe to real-time vaccination session updates
 * @param {string} barangayId - The barangay ID (null for admins to see all)
 * @param {Function} callback - Callback function when updates occur
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToVaccinationSessionUpdates(barangayId, callback) {
  const channelName = barangayId ? `sessions_${barangayId}` : `sessions_all_${Date.now()}`;
  
  const subscriptionConfig = {
    event: "*",
    schema: "public",
    table: "vaccination_sessions",
  };
  
  // Only add filter if barangayId is provided
  if (barangayId) {
    subscriptionConfig.filter = `barangay_id=eq.${barangayId}`;
  }
  
  const subscription = supabase
    .channel(channelName)
    .on("postgres_changes", subscriptionConfig, (payload) => {
      console.log("🔔 Vaccination session update received:", payload);
      callback(payload);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * Subscribe to real-time inventory updates (for low stock alerts)
 * @param {Function} callback - Callback function when updates occur
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToInventoryUpdates(callback) {
  const subscription = supabase
    .channel(`inventory_updates_${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "barangay_vaccine_inventory",
      },
      (payload) => {
        console.log("🔔 Inventory update received:", payload);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

/**
 * Fetch low stock notifications based on %STOCK LEVEL
 * Based on NIP evaluation: UNDERSTOCK (< 100%) and STOCKOUT (0%)
 * @param {number} stockPercentageThreshold - Alert when stock % is below this (default 100%)
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function fetchLowStockNotifications(stockPercentageThreshold = 100) {
  try {
    // Fetch ALL inventory (not just low quantity) to calculate stock percentage
    const { data: inventory, error: inventoryError } = await supabase
      .from("barangay_vaccine_inventory")
      .select(`
        id,
        vaccine_id,
        barangay_id,
        quantity_vial,
        quantity_dose,
        updated_at
      `)
      .gt("quantity_vial", 0) // Only check items with stock (0 will be handled separately)
      .order("quantity_vial", { ascending: true });

    // Also fetch out of stock items (quantity_vial = 0)
    const { data: outOfStock, error: outOfStockError } = await supabase
      .from("barangay_vaccine_inventory")
      .select(`
        id,
        vaccine_id,
        barangay_id,
        quantity_vial,
        quantity_dose,
        updated_at
      `)
      .eq("quantity_vial", 0);

    if (inventoryError && outOfStockError) {
      console.log("Low stock query issue (table may not exist):", inventoryError.message);
      return { data: [], error: null };
    }

    // Combine all inventory items
    const allInventory = [
      ...(inventory || []),
      ...(outOfStock || [])
    ];

    if (allInventory.length === 0) {
      return { data: [], error: null };
    }

    // Get unique vaccine IDs and barangay IDs
    const vaccineIds = [...new Set(allInventory.map(i => i.vaccine_id))];
    const barangayIds = [...new Set(allInventory.map(i => i.barangay_id))];

    // Fetch vaccine names separately - try vaccine_doses first, then vaccines
    let vaccineMap = {};
    const { data: vaccineDoses } = await supabase
      .from("vaccine_doses")
      .select("id, name, vaccine(name)")
      .in("id", vaccineIds);
    
    if (vaccineDoses && vaccineDoses.length > 0) {
      vaccineMap = Object.fromEntries(
        vaccineDoses.map(v => {
          const vaccineName = v.vaccine?.name || v.name || "Unknown Vaccine";
          return [v.id, vaccineName];
        })
      );
    } else {
      // Fallback to vaccines table
      const { data: vaccines } = await supabase
        .from("vaccines")
        .select("id, name")
        .in("id", vaccineIds);
      if (vaccines) {
        vaccineMap = Object.fromEntries(vaccines.map(v => [v.id, v.name]));
      }
    }

    // Fetch barangay names separately
    let barangayMap = {};
    const { data: barangays } = await supabase
      .from("barangays")
      .select("id, name")
      .in("id", barangayIds);
    if (barangays) {
      barangayMap = Object.fromEntries(barangays.map(b => [b.id, b.name]));
    }

    // Calculate stock percentage and filter low stock items
    const lowStockItems = allInventory.filter((item) => {
      const vaccineName = vaccineMap[item.vaccine_id] || "Unknown Vaccine";
      const currentQuantity = item.quantity_vial || item.quantity || 0;
      
      // STOCKOUT: Always notify when quantity is 0
      if (currentQuantity === 0) {
        return true;
      }

      // Calculate %STOCK LEVEL = (Current Quantity / Max Allocation) × 100
      const maxAllocation = getMaxAllocation(vaccineName);
      if (maxAllocation === 0) {
        // If no max allocation defined, use simple threshold (5 vials)
        return currentQuantity <= 5;
      }

      const stockPercentage = calculateStockPercentage(currentQuantity, maxAllocation);
      
      // UNDERSTOCK: Notify when stock % is below threshold (default 100%)
      return stockPercentage < stockPercentageThreshold;
    });

    // Transform into notifications
    const notifications = lowStockItems.map((item) => {
      const vaccineName = vaccineMap[item.vaccine_id] || "Unknown Vaccine";
      const barangayName = barangayMap[item.barangay_id] || "Unknown Barangay";
      const currentQuantity = item.quantity_vial || item.quantity || 0;
      const isOutOfStock = currentQuantity === 0;
      
      // Calculate stock percentage for display
      const maxAllocation = getMaxAllocation(vaccineName);
      const stockPercentage = maxAllocation > 0 
        ? calculateStockPercentage(currentQuantity, maxAllocation)
        : 0;

      let title, description, status, color;
      
      if (isOutOfStock) {
        title = "🔴 STOCKOUT";
        description = `${vaccineName} is out of stock (0 vials) in ${barangayName}`;
        status = "critical";
        color = "red";
      } else {
        title = "🟠 UNDERSTOCK";
        description = `${vaccineName} is understocked (${currentQuantity} vials, ${stockPercentage.toFixed(1)}% of max allocation) in ${barangayName}`;
        status = "warning";
        color = "orange";
      }

      return {
        id: `low-stock-${item.id}`,
        type: "low-stock",
        title,
        description,
        vaccineName,
        barangayName,
        quantity: currentQuantity,
        stockPercentage: stockPercentage.toFixed(2),
        maxAllocation,
        status,
        timestamp: item.updated_at,
        date: new Date(item.updated_at),
        read: false,
        archived: false,
        icon: isOutOfStock ? "critical" : "warning",
        color,
      };
    });

    return { data: notifications, error: null };
  } catch (err) {
    console.error("Error in fetchLowStockNotifications:", err);
    return { data: [], error: err.message };
  }
}

/**
 * Check if a specific vaccine is low in stock based on %STOCK LEVEL
 * @param {string} vaccineId - The vaccine ID
 * @param {string} barangayId - The barangay ID
 * @param {string} vaccineName - The vaccine name (for max allocation lookup)
 * @param {number} stockPercentageThreshold - Alert when stock % is below this (default 100%)
 * @returns {Promise<{isLow: boolean, quantity: number, stockPercentage: number, error: string|null}>}
 */
export async function checkVaccineLowStock(vaccineId, barangayId, vaccineName = null, stockPercentageThreshold = 100) {
  try {
    const { data, error } = await supabase
      .from("barangay_vaccine_inventory")
      .select("quantity, quantity_vial")
      .eq("vaccine_id", vaccineId)
      .eq("barangay_id", barangayId)
      .single();

    if (error) {
      return { isLow: false, quantity: 0, stockPercentage: 0, error: error.message };
    }

    const currentQuantity = data.quantity_vial || data.quantity || 0;
    
    // STOCKOUT: Always low if quantity is 0
    if (currentQuantity === 0) {
      return {
        isLow: true,
        quantity: 0,
        stockPercentage: 0,
        error: null
      };
    }

    // If vaccine name provided, calculate stock percentage
    if (vaccineName) {
      const maxAllocation = getMaxAllocation(vaccineName);
      if (maxAllocation > 0) {
        const stockPercentage = calculateStockPercentage(currentQuantity, maxAllocation);
        return {
          isLow: stockPercentage < stockPercentageThreshold,
          quantity: currentQuantity,
          stockPercentage,
          error: null
        };
      }
    }

    // Fallback: use simple threshold (5 vials) if no max allocation available
    return {
      isLow: currentQuantity <= 5,
      quantity: currentQuantity,
      stockPercentage: 0,
      error: null
    };
  } catch (err) {
    return { isLow: false, quantity: 0, stockPercentage: 0, error: err.message };
  }
}

/**
 * Create a notification for inventory changes (deduction/add-back)
 * @param {string} vaccineName - The vaccine name
 * @param {string} barangayName - The barangay name
 * @param {number} vialsChanged - Number of vials deducted/added
 * @param {number} dosesChanged - Number of doses deducted/added
 * @param {string} type - 'deducted' or 'added'
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function createInventoryChangeNotification(vaccineName, barangayName, vialsChanged, dosesChanged, type = 'deducted') {
  try {
    const notification = {
      id: `inventory_${Date.now()}_${Math.random()}`,
      type: 'inventory_change',
      title: `Inventory ${type === 'deducted' ? 'Deducted' : 'Added'}`,
      message: `${vialsChanged} vials (${dosesChanged} doses) of ${vaccineName} ${type === 'deducted' ? 'deducted from' : 'added to'} ${barangayName}`,
      vaccineName,
      barangayName,
      vialsChanged,
      dosesChanged,
      changeType: type,
      timestamp: new Date().toISOString(),
      date: new Date(),
      read: false,
      archived: false,
      icon: type === 'deducted' ? 'info' : 'success',
      color: type === 'deducted' ? 'blue' : 'green'
    };

    // Dispatch event to update notifications in real-time
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('notificationUpdate', {
          detail: { notification }
        }));
      }, 0);
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error creating inventory change notification:', err);
    return { success: false, error: err.message };
  }
<<<<<<< Updated upstream
}
=======
}
>>>>>>> Stashed changes
