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
      headers: {}
    };

    // Handle file uploads (FormData)
    if (body && body.isFileUpload && body.fileContent) {
      try {
        // Reconstruct FormData from stored file content in IndexedDB
        const formData = new FormData();
        
        // Ensure fileContent is a string (it should be stored as string in IndexedDB)
        let fileContent = body.fileContent;
        
        // Handle different possible formats
        if (typeof fileContent !== 'string') {
          if (fileContent instanceof ArrayBuffer) {
            fileContent = new TextDecoder('utf-8').decode(fileContent);
          } else if (fileContent instanceof Blob) {
            fileContent = await fileContent.text();
          } else {
            fileContent = String(fileContent || '');
          }
        }
        
        // Validate file content
        if (!fileContent || fileContent.length === 0) {
          throw new Error('File content is empty or invalid. File may not have been stored correctly.');
        }
        
        // Create File object from stored content
        const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8' });
        const file = new File([blob], body.fileName || 'masterlist.csv', { 
          type: 'text/csv',
          lastModified: body.queuedAt ? new Date(body.queuedAt).getTime() : Date.now()
        });
        
        // Validate file was created correctly
        if (file.size === 0) {
          throw new Error('Reconstructed file is empty');
        }
        
        // Build FormData
        formData.append('file', file);
        formData.append('barangay', body.barangay || '');
        formData.append('submitted_by', body.submitted_by || '');
        
        console.log('Reconstructing FormData for file upload:', {
          fileName: body.fileName,
          originalFileSize: body.fileSize || fileContent.length,
          reconstructedFileSize: file.size,
          fileContentLength: fileContent.length,
          barangay: body.barangay,
          submitted_by: body.submitted_by,
          queuedAt: body.queuedAt
        });
        
        // Don't set Content-Type header - browser will set it with boundary for FormData
        options.body = formData;
      } catch (fileError) {
        console.error('Error reconstructing FormData:', {
          error: fileError.message,
          stack: fileError.stack,
          bodyKeys: Object.keys(body),
          hasFileContent: !!body.fileContent,
          fileContentType: typeof body.fileContent,
          fileName: body.fileName
        });
        throw new Error(`Failed to reconstruct file for upload: ${fileError.message}`);
      }
    } else if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      // Set Content-Type for JSON requests
      options.headers['Content-Type'] = 'application/json';
      // Remove temporary IDs and internal flags before sending to server
      const cleanBody = { ...body };
      
      // Remove temporary ID if present (server will generate real ID)
      if (isTempId(cleanBody.id)) {
        delete cleanBody.id;
      }
      
      // Remove internal flags and metadata
      delete cleanBody._pending;
      delete cleanBody.isFileUpload;
      delete cleanBody.fileContent;
      delete cleanBody.fileName;
      
      // Log the cleaned body for debugging
      console.log('Sending request body:', {
        endpoint,
        method,
        bodyKeys: Object.keys(cleanBody),
        hasRequiredFields: {
          name: !!cleanBody.name,
          birthday: !!cleanBody.birthday,
          sex: !!cleanBody.sex,
          address: !!cleanBody.address,
          contact: !!cleanBody.contact,
          barangay_id: !!cleanBody.barangay_id,
          barangay: !!cleanBody.barangay,
          submitted_by: !!cleanBody.submitted_by
        },
        bodyPreview: {
          name: cleanBody.name,
          birthday: cleanBody.birthday,
          sex: cleanBody.sex,
          address: cleanBody.address,
          contact: cleanBody.contact,
          barangay_id: cleanBody.barangay_id,
          barangay: cleanBody.barangay,
          submitted_by: cleanBody.submitted_by
        }
      });
      
      options.body = JSON.stringify(cleanBody);
    } else if (body && method === 'DELETE' && !params) {
      // Only add body for DELETE if params are not used
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      let errorData = {};
      let responseText = '';
      try {
        responseText = await response.text();
        if (responseText) {
          try {
            errorData = JSON.parse(responseText);
          } catch (parseError) {
            // If JSON parsing fails, use the raw text
            errorData = { error: responseText || response.statusText || `HTTP ${response.status}` };
          }
        } else {
          errorData = { error: response.statusText || `HTTP ${response.status}` };
        }
      } catch (e) {
        // If text reading fails, use status text
        errorData = { error: response.statusText || `HTTP ${response.status}` };
      }
      
      // Log more details for debugging
      let bodyPreview;
      if (body && body.isFileUpload) {
        bodyPreview = {
          type: 'FileUpload',
          fileName: body.fileName,
          fileContentLength: body.fileContent ? (typeof body.fileContent === 'string' ? body.fileContent.length : 'unknown') : 0,
          barangay: body.barangay,
          submitted_by: body.submitted_by,
          hasFileContent: !!body.fileContent,
          fileContentPreview: body.fileContent ? (typeof body.fileContent === 'string' ? body.fileContent.substring(0, 200) : '[non-string]') : '[empty]'
        };
      } else if (body) {
        bodyPreview = {
          keys: Object.keys(body),
          preview: {
            name: body.name,
            birthday: body.birthday,
            sex: body.sex,
            address: body.address,
            contact: body.contact,
            barangay_id: body.barangay_id,
            barangay: body.barangay,
            submitted_by: body.submitted_by,
            vaccine_status: body.vaccine_status,
            vaccines_given: body.vaccines_given
          },
          hasAllRequiredFields: !!(body.name && body.birthday && body.sex && body.address && body.contact && (body.barangay_id || body.barangay) && body.submitted_by)
        };
      } else {
        bodyPreview = '[No body]';
      }
      
      console.error('Operation failed:', {
        endpoint,
        method,
        status: response.status,
        statusText: response.statusText,
        error: errorData.error || errorData.message || errorData,
        errorDetails: errorData,
        responseText: responseText.substring(0, 1000), // First 1000 chars of response
        bodyPreview
      });
      
      const errorMessage = errorData.error || errorData.message || errorData.missingFields 
        ? (Array.isArray(errorData.missingFields) 
          ? `Missing required fields: ${errorData.missingFields.join(', ')}` 
          : errorData.error || errorData.message)
        : `HTTP ${response.status}: ${response.statusText}`;
      
      throw new Error(errorMessage);
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
  try {
    console.log('Syncing operation:', {
      id: operation.id,
      endpoint: operation.endpoint,
      method: operation.method,
      type: operation.type,
      description: operation.description
    });
    
    const result = await executeOperation(operation);

    if (result.success) {
      // Operation succeeded, remove from pending
      await deletePendingOperation(operation.id);
      console.log('Operation synced successfully:', operation.id);
      return true;
    } else {
      // Operation failed, update retry count
      const newRetryCount = (operation.retryCount || 0) + 1;
      console.warn('Operation failed:', {
        id: operation.id,
        error: result.error,
        retryCount: newRetryCount,
        maxRetries: MAX_RETRIES
      });
      
      if (newRetryCount >= MAX_RETRIES) {
        // Mark as failed after max retries
        await updatePendingOperation(operation.id, {
          status: 'failed',
          retryCount: newRetryCount,
          lastError: result.error,
          failedAt: Date.now()
        });
        return false;
      } else {
        // Update retry count and try again later
        await updatePendingOperation(operation.id, {
          retryCount: newRetryCount,
          lastError: result.error,
          lastRetryAt: Date.now()
        });
        return false;
      }
    }
  } catch (error) {
    console.error('Error syncing operation:', {
      operationId: operation.id,
      error: error.message,
      stack: error.stack
    });
    // Mark as failed if there's an unexpected error
    await updatePendingOperation(operation.id, {
      status: 'failed',
      lastError: error.message,
      failedAt: Date.now()
    }).catch(e => console.error('Failed to update operation status:', e));
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


