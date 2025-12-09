"use client";

import { Toaster } from "sonner";
import { OfflineProvider } from "./OfflineProvider";
import { OfflineStatusBanner, FloatingSyncButton } from "./OfflineStatusBanner";

/**
 * Client-side providers wrapper
 * Includes offline functionality and other client-side context providers
 */
export function Providers({ children }) {
  return (
    <OfflineProvider>
      {/* Offline status banner - shows at top when offline or syncing */}
      <OfflineStatusBanner />
      
      {/* Main content - add top padding when banner is visible */}
      <div className="min-h-screen">
        {children}
      </div>
      
      {/* Floating sync button for mobile */}
      <FloatingSyncButton />
      
      {/* Toast notifications */}
      <Toaster position="top-right" richColors />
    </OfflineProvider>
  );
}

export default Providers;


