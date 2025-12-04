/**
 * IndexedDB-based offline storage utility for VaxSync
 * Handles caching of data and pending operations when offline
 */

const DB_NAME = 'VaxSyncOfflineDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  CACHE: 'dataCache',
  PENDING_OPERATIONS: 'pendingOperations',
  METADATA: 'metadata'
};

let dbInstance = null;

/**
 * Initialize and open the IndexedDB database
 */
export async function openDatabase() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Data cache store - stores cached API responses
      if (!db.objectStoreNames.contains(STORES.CACHE)) {
        const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
        cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        cacheStore.createIndex('type', 'type', { unique: false });
      }

      // Pending operations store - stores operations to sync when online
      if (!db.objectStoreNames.contains(STORES.PENDING_OPERATIONS)) {
        const pendingStore = db.createObjectStore(STORES.PENDING_OPERATIONS, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        pendingStore.createIndex('type', 'type', { unique: false });
        pendingStore.createIndex('status', 'status', { unique: false });
      }

      // Metadata store - stores sync status and other metadata
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Cache data with a specific key
 * @param {string} key - Cache key (e.g., 'residents_pending', 'users')
 * @param {any} data - Data to cache
 * @param {string} type - Data type for filtering
 */
export async function cacheData(key, data, type = 'general') {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CACHE], 'readwrite');
    const store = transaction.objectStore(STORES.CACHE);
    
    const record = {
      key,
      data,
      type,
      timestamp: Date.now()
    };
    
    const request = store.put(record);
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get cached data by key
 * @param {string} key - Cache key
 * @returns {any} Cached data or null
 */
export async function getCachedData(key) {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CACHE], 'readonly');
    const store = transaction.objectStore(STORES.CACHE);
    const request = store.get(key);
    
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.data : null);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get cached data with metadata (including timestamp)
 * @param {string} key - Cache key
 * @returns {object} Full cache record or null
 */
export async function getCachedDataWithMeta(key) {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CACHE], 'readonly');
    const store = transaction.objectStore(STORES.CACHE);
    const request = store.get(key);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete cached data by key
 * @param {string} key - Cache key
 */
export async function deleteCachedData(key) {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CACHE], 'readwrite');
    const store = transaction.objectStore(STORES.CACHE);
    const request = store.delete(key);
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all cached data
 */
export async function clearAllCache() {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CACHE], 'readwrite');
    const store = transaction.objectStore(STORES.CACHE);
    const request = store.clear();
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Add a pending operation to the queue
 * @param {object} operation - Operation details
 * @returns {number} Operation ID
 */
export async function addPendingOperation(operation) {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_OPERATIONS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_OPERATIONS);
    
    const record = {
      ...operation,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    };
    
    const request = store.add(record);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending operations
 * @param {string} status - Filter by status (optional)
 * @returns {array} List of pending operations
 */
export async function getPendingOperations(status = null) {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_OPERATIONS], 'readonly');
    const store = transaction.objectStore(STORES.PENDING_OPERATIONS);
    const request = store.getAll();
    
    request.onsuccess = () => {
      let results = request.result || [];
      if (status) {
        results = results.filter(op => op.status === status);
      }
      // Sort by timestamp
      results.sort((a, b) => a.timestamp - b.timestamp);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update a pending operation
 * @param {number} id - Operation ID
 * @param {object} updates - Fields to update
 */
export async function updatePendingOperation(id, updates) {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_OPERATIONS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_OPERATIONS);
    
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const record = getRequest.result;
      if (record) {
        const updated = { ...record, ...updates };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve(true);
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve(false);
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Delete a pending operation
 * @param {number} id - Operation ID
 */
export async function deletePendingOperation(id) {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_OPERATIONS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_OPERATIONS);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all pending operations (use after successful sync)
 */
export async function clearPendingOperations() {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_OPERATIONS], 'readwrite');
    const store = transaction.objectStore(STORES.PENDING_OPERATIONS);
    const request = store.clear();
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get pending operations count
 * @returns {number} Number of pending operations
 */
export async function getPendingOperationsCount() {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PENDING_OPERATIONS], 'readonly');
    const store = transaction.objectStore(STORES.PENDING_OPERATIONS);
    const index = store.index('status');
    const request = index.count(IDBKeyRange.only('pending'));
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save metadata
 * @param {string} key - Metadata key
 * @param {any} value - Metadata value
 */
export async function saveMetadata(key, value) {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.METADATA], 'readwrite');
    const store = transaction.objectStore(STORES.METADATA);
    const request = store.put({ key, value, timestamp: Date.now() });
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get metadata
 * @param {string} key - Metadata key
 * @returns {any} Metadata value or null
 */
export async function getMetadata(key) {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.METADATA], 'readonly');
    const store = transaction.objectStore(STORES.METADATA);
    const request = store.get(key);
    
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.value : null);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generate a temporary ID for offline-created items
 * @returns {string} Temporary ID with 'temp_' prefix
 */
export function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if an ID is a temporary offline ID
 * @param {string} id - ID to check
 * @returns {boolean} True if temporary ID
 */
export function isTempId(id) {
  return typeof id === 'string' && id.startsWith('temp_');
}

/**
 * Apply a pending operation to cached data (optimistic update)
 * @param {string} cacheKey - Cache key to update
 * @param {object} operation - Operation to apply
 */
export async function applyOperationToCache(cacheKey, operation) {
  const cachedData = await getCachedData(cacheKey);
  if (!cachedData) return;

  let updatedData;

  switch (operation.method) {
    case 'POST':
      // Add new item
      if (Array.isArray(cachedData)) {
        updatedData = [...cachedData, { ...operation.body, id: operation.tempId }];
      } else if (cachedData.residents) {
        updatedData = { 
          ...cachedData, 
          residents: [...cachedData.residents, { ...operation.body, id: operation.tempId }] 
        };
      } else {
        updatedData = cachedData;
      }
      break;

    case 'PUT':
    case 'PATCH':
      // Update existing item
      if (Array.isArray(cachedData)) {
        updatedData = cachedData.map(item => 
          item.id === operation.body.id ? { ...item, ...operation.body } : item
        );
      } else if (cachedData.residents) {
        updatedData = {
          ...cachedData,
          residents: cachedData.residents.map(item =>
            item.id === operation.body.id ? { ...item, ...operation.body } : item
          )
        };
      } else {
        updatedData = cachedData;
      }
      break;

    case 'DELETE':
      // Remove item
      const deleteId = operation.body?.id || operation.params?.id;
      if (Array.isArray(cachedData)) {
        updatedData = cachedData.filter(item => item.id !== deleteId);
      } else if (cachedData.residents) {
        updatedData = {
          ...cachedData,
          residents: cachedData.residents.filter(item => item.id !== deleteId)
        };
      } else {
        updatedData = cachedData;
      }
      break;

    default:
      updatedData = cachedData;
  }

  await cacheData(cacheKey, updatedData, 'general');
  return updatedData;
}

export default {
  openDatabase,
  cacheData,
  getCachedData,
  getCachedDataWithMeta,
  deleteCachedData,
  clearAllCache,
  addPendingOperation,
  getPendingOperations,
  updatePendingOperation,
  deletePendingOperation,
  clearPendingOperations,
  getPendingOperationsCount,
  saveMetadata,
  getMetadata,
  generateTempId,
  isTempId,
  applyOperationToCache
};


