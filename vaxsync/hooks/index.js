/**
 * Central export for all offline-enabled hooks
 * Import from '@/hooks' for easy access to all hooks
 */

// Core offline hooks
export { useOfflineApi } from './UseOfflineApi';
export { useOfflineData } from './UseOfflineData';
export { useOnlineStatus } from './UseOnlineStatus';

// Feature-specific offline hooks
export { useOfflineResidents } from './UseOfflineResidents';
export { useOfflineUsers } from './UseOfflineUsers';
export { useOfflineInventory } from './UseOfflineInventory';
export { useOfflineVaccineRequests } from './UseOfflineVaccineRequests';

// Re-export existing hooks
export { default as useMobile } from './UseMobile';


