/**
 * Central export for all offline-enabled hooks
 * Import from '@/hooks' for easy access to all hooks
 */

// Core offline hooks
export { useOfflineApi } from './useOfflineApi';
export { useOfflineData } from './useOfflineData';
export { useOnlineStatus } from './useOnlineStatus';

// Feature-specific offline hooks
export { useOfflineResidents } from './useOfflineResidents';
export { useOfflineUsers } from './useOfflineUsers';
export { useOfflineInventory } from './useOfflineInventory';
export { useOfflineVaccineRequests } from './useOfflineVaccineRequests';

// Re-export existing hooks
export { default as useMobile } from './UseMobile';


