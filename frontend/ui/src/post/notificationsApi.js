import api from "../api";

export const fetchMyNotifications = async () => {
  const response = await api.get("/notifications/my", {
    withCredentials: true,
    params: { limit: 30 },
    timeout: 15000,
  });
  return response.data || [];
};

export const markNotificationRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`, {}, { withCredentials: true });
  const unreadCount = Number(response?.data?.unreadCount);
  return Number.isFinite(unreadCount) ? unreadCount : null;
};

export const markAllNotificationsRead = async () => {
  const response = await api.patch("/notifications/read-all", {}, { withCredentials: true });
  const unreadCount = Number(response?.data?.unreadCount);
  return Number.isFinite(unreadCount) ? unreadCount : null;
};

export const subscribeNotificationStream = ({ onNotification, onUnreadCount, onOpen, onError }) => {
  const baseUrl = api.defaults.baseURL || window.location.origin;
  const streamUrl = new URL("/notifications/stream", baseUrl).toString();
  const stream = new EventSource(streamUrl, { withCredentials: true });

  stream.addEventListener("connected", () => {
    if (typeof onOpen === "function") {
      onOpen();
    }
  });

  stream.addEventListener("new-notification", (event) => {
    if (typeof onNotification !== "function") {
      return;
    }

    try {
      onNotification(JSON.parse(event.data));
    } catch {
      // Ignore malformed payloads.
    }
  });

  stream.addEventListener("unread-count", (event) => {
    if (typeof onUnreadCount !== "function") {
      return;
    }

    const count = Number(event.data);
    if (!Number.isNaN(count)) {
      onUnreadCount(count);
    }
  });

  stream.onerror = (error) => {
    if (typeof onError === "function") {
      onError(error);
    }
  };

  return stream;
};
