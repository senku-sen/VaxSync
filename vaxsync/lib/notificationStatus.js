/**
 * Get notification status from localStorage
 * Returns a map of notification IDs to their read/archived status
 */
export async function getNotificationStatus(userId) {
  try {
    // Get notifications from localStorage based on user role
    const headNurseNotifications = localStorage.getItem('headNurseNotifications');
    const healthWorkerNotifications = localStorage.getItem('healthWorkerNotifications');
    
    const notifications = [];
    
    if (headNurseNotifications) {
      try {
        notifications.push(...JSON.parse(headNurseNotifications));
      } catch (err) {
        console.warn('Failed to parse headNurseNotifications:', err);
      }
    }
    
    if (healthWorkerNotifications) {
      try {
        notifications.push(...JSON.parse(healthWorkerNotifications));
      } catch (err) {
        console.warn('Failed to parse healthWorkerNotifications:', err);
      }
    }
    
    // Create a status map: notification ID -> { read, archived }
    const statusMap = {};
    notifications.forEach((notif) => {
      if (notif.id) {
        statusMap[notif.id] = {
          read: notif.read || false,
          archived: notif.archived || false
        };
      }
    });
    
    return statusMap;
  } catch (err) {
    console.error('Error getting notification status:', err);
    return {};
  }
}
