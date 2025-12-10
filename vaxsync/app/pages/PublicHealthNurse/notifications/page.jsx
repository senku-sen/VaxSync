"use client";

import { useState, useEffect, useMemo } from "react";
import Sidebar from "../../../../components/shared/Sidebar";
import Header from "../../../../components/shared/Header";
import { 
  fetchVaccineRequestNotifications, 
  fetchResidentApprovalNotifications,
  fetchVaccinationSessionNotifications,
  fetchLowStockNotifications,
  formatNotificationTimestamp, 
  getStatusBadgeColor, 
  getStatusIconBgColor, 
  getStatusIconColor, 
  subscribeToVaccineRequestUpdates,
  subscribeToResidentUpdates,
  subscribeToVaccinationSessionUpdates,
  subscribeToInventoryUpdates,
} from "@/lib/notification";
import { loadUserProfile } from "@/lib/vaccineRequest";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [barangayId, setBarangayId] = useState(null);
  const [isPHN, setIsPHN] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const cacheKey = isPHN ? "headNurseNotifications" : "healthWorkerNotifications";

  // Load profile, cached notifications, then fetch fresh
  useEffect(() => {
    const init = async () => {
    try {
      setIsLoading(true);
      const profile = await loadUserProfile();
        if (!profile || !profile.id) return;
        const phn = profile.user_role === "Public Health Nurse";
        setUserId(profile.id);
        setBarangayId(profile.assigned_barangay_id);
        setIsPHN(phn);

        // Load cached for this role
        try {
          const cached = localStorage.getItem(phn ? "headNurseNotifications" : "healthWorkerNotifications");
          if (cached) {
            const parsed = JSON.parse(cached);
            setNotifications(parsed);
          }
            } catch (e) {
          console.warn("Cache parse error", e);
        }

        // Fetch fresh
        await fetchFreshNotifications(profile.id, profile.assigned_barangay_id, phn);
    } catch (err) {
        console.error("Error initializing notifications:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
    init();
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    if (!userId) return;

    const refreshWithPreserved = async () => {
      try {
        const profile = await loadUserProfile();
        const phn = profile?.user_role === "Public Health Nurse";
        const cKey = phn ? "headNurseNotifications" : "healthWorkerNotifications";
        
        // Read current read status from localStorage instead of state to avoid stale data
        let currentReadStatus = {};
        try {
          const cached = localStorage.getItem(cKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            currentReadStatus = Object.fromEntries(
              parsed.map((n) => [n.id, { read: n.read, archived: n.archived }])
            );
          }
        } catch (e) {
          console.warn("Error reading cached notifications:", e);
        }

        const [
          { data: vaccineNotifications },
          { data: residentNotifications },
          { data: sessionNotifications },
          { data: lowStockNotifications },
        ] = await Promise.all([
          (phn ? fetchVaccineRequestNotifications(null) : fetchVaccineRequestNotifications(userId)).catch(() => ({
            data: [],
          })),
          (phn ? fetchResidentApprovalNotifications(null) : fetchResidentApprovalNotifications(userId)).catch(
            () => ({ data: [] })
          ),
          (phn
            ? fetchVaccinationSessionNotifications(userId, null, true)
            : fetchVaccinationSessionNotifications(userId, barangayId, false)
          ).catch(() => ({ data: [] })),
          phn ? fetchLowStockNotifications(100).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        ]);

        const all = [
          ...(vaccineNotifications || []),
          ...(residentNotifications || []),
          ...(sessionNotifications || []),
          ...(lowStockNotifications || []),
        ].sort(
          (a, b) =>
            new Date(b.timestamp || b.created_at || b.date || 0) -
            new Date(a.timestamp || a.created_at || a.date || 0)
        );

        const merged = all.map((n) => ({
          ...n,
          read: currentReadStatus[n.id]?.read ?? false,
          archived: currentReadStatus[n.id]?.archived ?? false,
        }));

        setNotifications(merged);
        localStorage.setItem(cKey, JSON.stringify(merged));
        setTimeout(() => window.dispatchEvent(new CustomEvent("notificationUpdate")), 0);
      } catch (err) {
        console.error("Error refreshing notifications:", err);
      }
    };

    const unsubscribes = [
      subscribeToVaccineRequestUpdates(isPHN ? null : userId, refreshWithPreserved),
      subscribeToResidentUpdates(isPHN ? null : userId, refreshWithPreserved),
      subscribeToVaccinationSessionUpdates(isPHN ? null : barangayId, refreshWithPreserved),
      subscribeToInventoryUpdates(refreshWithPreserved),
    ];

    return () => {
      unsubscribes.forEach((u) => u && u());
    };
  }, [userId, barangayId, isPHN]); // Removed notifications from dependencies to prevent infinite loops

  const fetchFreshNotifications = async (uid, bId, phn) => {
    try {
      setIsLoading(true);
      const cKey = phn ? "headNurseNotifications" : "healthWorkerNotifications";

      const [
        { data: vaccineNotifications },
        { data: residentNotifications },
        { data: sessionNotifications },
        { data: lowStockNotifications },
      ] = await Promise.all([
        (phn ? fetchVaccineRequestNotifications(null) : fetchVaccineRequestNotifications(uid)).catch(() => ({
          data: [],
        })),
        (phn ? fetchResidentApprovalNotifications(null) : fetchResidentApprovalNotifications(uid)).catch(() => ({
          data: [],
        })),
        (phn
          ? fetchVaccinationSessionNotifications(uid, null, true)
          : fetchVaccinationSessionNotifications(uid, bId, false)
        ).catch(() => ({ data: [] })),
        phn ? fetchLowStockNotifications(100).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);

      const cachedMap = (() => {
        try {
          const cached = localStorage.getItem(cKey);
          if (!cached) return {};
          const parsed = JSON.parse(cached);
          return Object.fromEntries(parsed.map((n) => [n.id, { read: n.read, archived: n.archived }]));
        } catch {
          return {};
        }
      })();

      const all = [
        ...(vaccineNotifications || []),
        ...(residentNotifications || []),
        ...(sessionNotifications || []),
        ...(lowStockNotifications || []),
      ].sort(
        (a, b) =>
          new Date(b.timestamp || b.created_at || b.date || 0) -
          new Date(a.timestamp || a.created_at || a.date || 0)
      );

      const merged = all.map((n) => ({
        ...n,
        read: cachedMap[n.id]?.read ?? false,
        archived: cachedMap[n.id]?.archived ?? false,
      }));

      setNotifications(merged);
      localStorage.setItem(cKey, JSON.stringify(merged));
      } catch (err) {
      console.error("Error initializing notifications:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cacheKeyMemo = useMemo(() => (isPHN ? "headNurseNotifications" : "healthWorkerNotifications"), [isPHN]);

  const handleToggleRead = (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n));
      localStorage.setItem(cacheKeyMemo, JSON.stringify(updated));
      setTimeout(() => window.dispatchEvent(new CustomEvent("notificationUpdate")), 0);
      return updated;
    });
  };

  const handleArchive = (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, archived: true, read: true } : n));
      localStorage.setItem(cacheKeyMemo, JSON.stringify(updated));
      setTimeout(() => window.dispatchEvent(new CustomEvent("notificationUpdate")), 0);
      return updated;
    });
  };

  const handleDelete = (id) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      localStorage.setItem(cacheKeyMemo, JSON.stringify(updated));
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: cacheKeyMemo,
          newValue: JSON.stringify(updated),
          oldValue: JSON.stringify(prev),
        })
      );
      return updated;
    });
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (!n.archived ? { ...n, read: true } : n));
      localStorage.setItem(cacheKeyMemo, JSON.stringify(updated));
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: cacheKeyMemo,
          newValue: JSON.stringify(updated),
          oldValue: JSON.stringify(prev),
        })
      );
      return updated;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map((n) => n.id));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleBulkArchive = () => {
    if (selectedIds.length === 0) return;
    setNotifications((prev) => {
      const updated = prev.map((n) => (selectedIds.includes(n.id) ? { ...n, archived: true, read: true } : n));
      localStorage.setItem(cacheKeyMemo, JSON.stringify(updated));
      setTimeout(() => window.dispatchEvent(new CustomEvent("notificationUpdate")), 0);
      setSelectedIds([]);
      return updated;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setNotifications((prev) => {
      const updated = prev.filter((n) => !selectedIds.includes(n.id));
      localStorage.setItem(cacheKeyMemo, JSON.stringify(updated));
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: cacheKeyMemo,
          newValue: JSON.stringify(updated),
          oldValue: JSON.stringify(prev),
        })
      );
      setSelectedIds([]);
      return updated;
    });
  };

  const handleBulkMarkRead = () => {
    if (selectedIds.length === 0) return;
    setNotifications((prev) => {
      const updated = prev.map((n) => (selectedIds.includes(n.id) ? { ...n, read: true } : n));
      localStorage.setItem(cacheKeyMemo, JSON.stringify(updated));
      setTimeout(() => window.dispatchEvent(new CustomEvent("notificationUpdate")), 0);
      setSelectedIds([]);
      return updated;
    });
  };

  const sortNotifications = (notifs) => {
    const sorted = [...notifs];
    switch (sortBy) {
      case "date-desc":
        return sorted.sort(
          (a, b) => new Date(b.timestamp || b.created_at || b.date || 0) - new Date(a.timestamp || a.created_at || a.date || 0)
        );
      case "date-asc":
        return sorted.sort(
          (a, b) => new Date(a.timestamp || a.created_at || a.date || 0) - new Date(b.timestamp || b.created_at || b.date || 0)
        );
      case "status": {
        const order = { pending: 0, approved: 1, rejected: 2, released: 3, "in-progress": 4, completed: 5, scheduled: 6 };
        return sorted.sort((a, b) => (order[a.status] || 99) - (order[b.status] || 99));
      }
      default:
        return sorted;
    }
  };

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
      switch (activeTab) {
      case "unread":
        filtered = notifications.filter((n) => !n.read && !n.archived);
          break;
      case "archived":
        filtered = notifications.filter((n) => n.archived);
          break;
      case "all":
        default:
        filtered = notifications.filter((n) => !n.archived);
          break;
      }
    return sortNotifications(filtered);
  }, [notifications, activeTab, sortBy]);

  const unreadCount = notifications.filter((n) => !n.read && !n.archived).length;
  const archivedCount = notifications.filter((n) => n.archived).length;

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "approved":
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "rejected":
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "released":
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full lg:ml-72">
        <Header title="Notification History" subtitle="View all notifications and past alerts" />
        <main className="p-3 sm:p-4 md:p-6 lg:p-8 flex-1 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto px-0 sm:px-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <button
                  onClick={() => {
                    setActiveTab("all");
                    setSelectedIds([]);
                  }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "all" ? "bg-[#3E5F44] text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                  All ({notifications.filter((n) => !n.archived).length})
              </button>
              <button
                  onClick={() => {
                    setActiveTab("unread");
                    setSelectedIds([]);
                  }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "unread" ? "bg-[#3E5F44] text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                  onClick={() => {
                    setActiveTab("archived");
                    setSelectedIds([]);
                  }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "archived" ? "bg-[#3E5F44] text-white" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Archived ({archivedCount})
              </button>
            </div>

            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                    onClick={handleMarkAllRead}
                  className="px-3 py-2 text-sm font-medium text-white bg-[#3E5F44] hover:bg-[#2d4532] rounded-md transition-colors"
                >
                  Mark All as Read
                </button>
              )}
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3E5F44] focus:border-transparent"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="status">By Status</option>
              </select>
            </div>
          </div>

            {filteredNotifications.length > 0 && (
              <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 accent-[#3E5F44] border-gray-300 rounded focus:ring-[#3E5F44] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select All ({selectedIds.length > 0 ? `${selectedIds.length} selected` : "None"})
                    </span>
                  </label>
                </div>
                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkMarkRead}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-[#3E5F44] hover:bg-[#2d4532] rounded-md transition-colors"
                    >
                      Mark as Read ({selectedIds.length})
                    </button>
                    <button
                      onClick={handleBulkArchive}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-[#4A7C59] hover:bg-[#3E5F44] rounded-md transition-colors"
                    >
                      Archive ({selectedIds.length})
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-[#C85A3C] hover:bg-[#A8452A] rounded-md transition-colors"
                    >
                      Delete ({selectedIds.length})
                    </button>
                  </div>
                )}
              </div>
            )}

          <div className="space-y-3">
            {isLoading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="flex justify-center mb-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3E5F44]"></div>
                </div>
                <p className="text-gray-500 font-medium">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg border border-red-200 p-6 text-center">
                <svg className="w-12 h-12 text-red-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600 font-medium">Error loading notifications</p>
                <p className="text-sm text-red-500 mt-1">{error}</p>
                <button
                    onClick={() => fetchFreshNotifications(userId, barangayId, isPHN)}
                  className="mt-3 px-4 py-2 text-sm font-medium text-white bg-[#3E5F44] hover:bg-[#2d4532] rounded-md transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-gray-500 font-medium">No notifications</p>
                  <p className="text-sm text-gray-400 mt-1">{activeTab === "unread" ? "You're all caught up!" : "No archived notifications"}</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl border-2 p-5 transition-all shadow-sm ${
                    notification.read 
                        ? "border-gray-200 hover:border-gray-300 hover:shadow-md"
                        : "border-[#4A7C59] bg-gradient-to-r from-green-50 to-white shadow-md hover:shadow-lg"
                    } ${selectedIds.includes(notification.id) ? "ring-2 ring-[#3E5F44] ring-offset-2" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notification.id)}
                        onChange={() => handleToggleSelect(notification.id)}
                        className="mt-1 w-4 h-4 accent-[#3E5F44] border-gray-300 rounded focus:ring-[#3E5F44] cursor-pointer"
                      />
                      <div
                        className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
                          notification.read ? getStatusIconBgColor(notification.status) : "bg-[#4A7C59]"
                        }`}
                      >
                      {getStatusIcon(notification.status)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                              <h3
                                className={`text-base font-bold ${
                                  notification.read ? "text-gray-900" : "text-[#4A7C59]"
                                }`}
                              >
                              {notification.title}
                            </h3>
                              {!notification.read && <span className="w-2.5 h-2.5 bg-[#4A7C59] rounded-full animate-pulse"></span>}
                          </div>
                            <p className="text-sm text-gray-700 mb-2 leading-relaxed">{notification.description}</p>
                          <p className="text-xs text-gray-500 mb-2">
                              {notification.type === "vaccine-request" && (
                              <>
                                <span className="font-medium">{notification.vaccineName}</span>
                                {notification.barangayName && ` • ${notification.barangayName}`}
                                {notification.quantity && ` • ${notification.quantity}`}
                              </>
                            )}
                              {notification.type === "resident-approval" && (
                              <>
                                <span className="font-medium">{notification.residentName}</span>
                                {notification.barangay && ` • ${notification.barangay}`}
                                {notification.vaccineStatus && ` • Status: ${notification.vaccineStatus}`}
                              </>
                            )}
                              {notification.type === "vaccination-session" && (
                              <>
                                <span className="font-medium">{notification.vaccineName}</span>
                                {notification.barangayName && ` • ${notification.barangayName}`}
                                {notification.sessionDate && ` • ${notification.sessionDate}`}
                                {notification.sessionTime && ` at ${notification.sessionTime}`}
                                {notification.progress !== undefined && ` • Progress: ${notification.progress}%`}
                              </>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border-2 ${getStatusBadgeColor(
                                  notification.status
                                )}`}
                              >
                                {notification.status.charAt(0).toUpperCase() + notification.status.slice(1).replace("-", " ")}
                            </span>
                            {notification.archived && (
                              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full border-2 bg-gray-100 text-gray-600 border-gray-300">
                                ARCHIVED
                              </span>
                            )}
                          </div>
                          {notification.notes && (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                                <p className="text-xs text-amber-800 font-medium">📝 Note: {notification.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 font-medium">
                            {formatNotificationTimestamp(notification.timestamp || notification.created_at || notification.date)}
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleRead(notification.id)}
                              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                                notification.read ? "text-[#4A7C59] hover:bg-green-50" : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {notification.read ? "✓ Mark unread" : "✓ Mark read"}
                          </button>
                          {!notification.archived && (
                            <button
                              onClick={() => handleArchive(notification.id)}
                              className="text-xs px-3 py-1.5 rounded-md font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              📦 Archive
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
