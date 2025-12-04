/**
 * Sync Manager for VaxSync
 * Handles synchronization of pending offline operations when internet returns
 */

import {
  getPendingOperations,
  updatePendingOperation,
  deletePendingOperation,
  saveMetadata,
  getMetadata,
  isTempId
} from './offlineStorage';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Event listeners for sync status updates
const listeners = new Set();

/**
 * Subscribe to sync status updates
 * @param {function} callback - Callback function
 * @returns {function} Unsubscribe function
 */
export function subscribeSyncStatus(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Notify all listeners of sync status change
 * @param {object} status - Current sync status
 */
function notifyListeners(status) {
  listeners.forEach(callback => {
    try {
      callback(status);
    } catch (error) {
      console.error('Sync status listener error:', error);
    }
  });
}

/**
 * Get current sync status
 * @returns {object} Sync status
 */
export async function getSyncStatus() {
  const pendingOps = await getPendingOperations('pending');
  const lastSync = await getMetadata('lastSyncTime');
  const isSyncing = await getMetadata('isSyncing');

  return {
    pendingCount: pendingOps.length,
    lastSyncTime: lastSync,
    isSyncing: isSyncing || false,
    pendingOperations: pendingOps
  };
}

/**
 * Execute a single API operation
 * @param {object} operation - Operation to execute
 * @returns {object} Result with success status and data/error
 */
async function executeOperation(operation) {
  const { endpoint, method, body, params } = operation;

  try {
    let url = endpoint;
    
    // Handle query parameters for DELETE
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url = `${endpoint}?${queryString}`;
    }

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Add body for POST, PUT, PATCH
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      // Remove temporary IDs before sending to server
      const cleanBody = { ...body };
      if (isTempId(cleanBody.id)) {
        delete cleanBody.id;
      }
      options.body = JSON.stringify(cleanBody);
    } else if (body && method === 'DELETE') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json().catch(() => ({}));
    return { success: true, data };

  } catch (error) {
    console.error('Operation execution failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync a single operation
 * @param {object} operation - Operation to sync
 * @returns {boolean} Whether sync was successful
 */
async function syncOperation(operation) {
  const result = await executeOperation(operation);

  if (result.success) {
    // Operation succeeded, remove from pending
    await deletePendingOperation(operation.id);
    return true;
  } else {
    // Operation failed, update retry count
    const newRetryCount = (operation.retryCount || 0) + 1;
    
    if (newRetryCount >= MAX_RETRIES) {
      // Mark as failed after max retries
      await updatePendingOperation(operation.id, {
        status: 'failed',
        retryCount: newRetryCount,
        lastError: result.error,
        lastAttempt: Date.now()
      });
    } else {
      // Update retry count
      await updatePendingOperation(operation.id, {
        retryCount: newRetryCount,
        lastError: result.error,
        lastAttempt: Date.now()
      });
    }
    return false;
  }
}

/**
 * Sync all pending operations
 * @param {object} options - Sync options
 * @returns {object} Sync results
 */
export async function syncAll(options = {}) {
  const { onProgress } = options;

  // Check if already syncing
  const isSyncing = await getMetadata('isSyncing');
  if (isSyncing) {
    console.log('Sync already in progress');
    return { synced: 0, failed: 0, skipped: true };
  }

  // Mark as syncing
  await saveMetadata('isSyncing', true);
  notifyListeners({ type: 'sync_started' });

  const pendingOps = await getPendingOperations('pending');
  let synced = 0;
  let failed = 0;

  try {
    for (let i = 0; i < pendingOps.length; i++) {
      const operation = pendingOps[i];
      
      // Notify progress
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: pendingOps.length,
          operation: operation.description || operation.type
        });
      }

      notifyListeners({
        type: 'sync_progress',
        current: i + 1,
        total: pendingOps.length,
        operation: operation.description || operation.type
      });

      const success = await syncOperation(operation);
      
      if (success) {
        synced++;
      } else {
        failed++;
      }

      // Small delay between operations to avoid overwhelming the server
      if (i < pendingOps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Update last sync time
    await saveMetadata('lastSyncTime', Date.now());

    notifyListeners({
      type: 'sync_completed',
      synced,
      failed,
      total: pendingOps.length
    });

    return { synced, failed, total: pendingOps.length };

  } finally {
    // Mark as not syncing
    await saveMetadata('isSyncing', false);
  }
}

/**
 * Retry failed operations
 * @returns {object} Retry results
 */
export async function retryFailed() {
  const failedOps = await getPendingOperations('failed');
  
  // Reset status to pending
  for (const op of failedOps) {
    await updatePendingOperation(op.id, {
      status: 'pending',
      retryCount: 0
    });
  }

  // Sync all
  return syncAll();
}

/**
 * Queue an operation for sync
 * This is a helper that creates the operation object
 * @param {object} params - Operation parameters
 * @returns {number} Operation ID
 */
export async function queueOperation({
  endpoint,
  method,
  body,
  params,
  type,
  description,
  cacheKey,
  tempId
}) {
  const { addPendingOperation } = await import('./offlineStorage');
  
  const operation = {
    endpoint,
    method,
    body,
    params,
    type,
    description,
    cacheKey,
    tempId
  };

  const id = await addPendingOperation(operation);
  
  // Notify listeners about new pending operation
  const status = await getSyncStatus();
  notifyListeners({
    type: 'operation_queued',
    operationId: id,
    pendingCount: status.pendingCount
  });

  return id;
}

/**
 * Clear a specific failed operation
 * @param {number} operationId - Operation ID to clear
 */
export async function clearFailedOperation(operationId) {
  await deletePendingOperation(operationId);
  
  const status = await getSyncStatus();
  notifyListeners({
    type: 'operation_cleared',
    pendingCount: status.pendingCount
  });
}

/**
 * Get failed operations
 * @returns {array} List of failed operations
 */
export async function getFailedOperations() {
  return getPendingOperations('failed');
}

/**
 * Check if there are pending operations
 * @returns {boolean} Whether there are pending operations
 */
export async function hasPendingOperations() {
  const count = await getPendingOperationsCount();
  return count > 0;
}

// Import for internal use
async function getPendingOperationsCount() {
  const { getPendingOperationsCount: getCount } = await import('./offlineStorage');
  return getCount();
}

export default {
  subscribeSyncStatus,
  getSyncStatus,
  syncAll,
  retryFailed,
  queueOperation,
  clearFailedOperation,
  getFailedOperations,
  hasPendingOperations
};

