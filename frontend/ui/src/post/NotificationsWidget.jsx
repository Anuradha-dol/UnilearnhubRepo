import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotificationStream,
} from "./notificationsApi";
import "./NotificationsWidget.css";

const formatInterest = (value) => {
  if (!value) return "";
  return value
      .split("_")
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(" ");
};

const timeAgo = (rawDate) => {
  if (!rawDate) return "Now";
  const date = new Date(rawDate);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (Number.isNaN(seconds) || seconds < 10) return "Now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function NotificationsWidget({ onNotificationClick, deferUntilOpen = false, enableStream = false }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [popupItems, setPopupItems] = useState([]);
  const seenIdsRef = useRef(new Set());
  const viewedIdsRef = useRef(new Set());
  const openRef = useRef(false);
  const initializedRef = useRef(false);
  const fetchInFlightRef = useRef(false);
  const markAllInFlightRef = useRef(false);
  const shouldStartLiveUpdates = !deferUntilOpen || open;

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const queuePopup = (notification) => {
    if (!notification || notification.isRead) return;
    setPopupItems((prev) => {
      if (prev.some((item) => item.notificationId === notification.notificationId)) {
        return prev;
      }
      return [notification, ...prev].slice(0, 3);
    });

    window.setTimeout(() => {
      setPopupItems((prev) => prev.filter((item) => item.notificationId !== notification.notificationId));
    }, 9000);
  };

  useEffect(() => {
    if (!shouldStartLiveUpdates) {
      return undefined;
    }

    let mounted = true;
    let pollId = null;
    let stream = null;

    const stopPolling = () => {
      if (pollId) {
        window.clearInterval(pollId);
        pollId = null;
      }
    };

    const applyNotifications = (data, { allowPopups = false } = {}) => {
      const safeData = Array.isArray(data) ? data : [];
      const normalizedData = safeData.map((item) => {
        const viewedLocally = viewedIdsRef.current.has(item.notificationId);
        if (item.isRead || viewedLocally) {
          return { ...item, isRead: true };
        }
        return item;
      });

      if (allowPopups && initializedRef.current) {
        const unseen = normalizedData.filter(
            (item) => !item.isRead && !seenIdsRef.current.has(item.notificationId)
        );
        unseen.slice(0, 3).forEach(queuePopup);
      }

      normalizedData.forEach((item) => seenIdsRef.current.add(item.notificationId));
      if (!initializedRef.current) {
        initializedRef.current = true;
      }

      setItems(normalizedData);
      setUnreadCount(normalizedData.filter((item) => !item.isRead).length);
    };

    const loadNotifications = async ({ allowPopups }) => {
      if (fetchInFlightRef.current) return;
      fetchInFlightRef.current = true;

      try {
        const data = await fetchMyNotifications();
        if (!mounted) return;
        applyNotifications(data, { allowPopups });
      } catch (error) {
        if (allowPopups) {
          // Ignore intermittent polling errors.
        } else {
          console.warn("Notifications initial load failed", error);
        }
      } finally {
        fetchInFlightRef.current = false;
      }
    };

    const startPolling = () => {
      if (pollId) {
        return;
      }

      pollId = window.setInterval(async () => {
        if (document.visibilityState !== "visible") return;
        await loadNotifications({ allowPopups: true });
      }, 30000);
    };

    loadNotifications({ allowPopups: false });

    if (enableStream) {
      stream = subscribeNotificationStream({
        onOpen: () => {
          stopPolling();
        },
        onNotification: (notification) => {
          if (!notification) return;

          const viewedLocally = viewedIdsRef.current.has(notification.notificationId) || openRef.current;
          if (viewedLocally) {
            viewedIdsRef.current.add(notification.notificationId);
          }
          const normalizedNotification = viewedLocally
              ? { ...notification, isRead: true }
              : notification;

          let isNew = false;
          setItems((prev) => {
            isNew = !prev.some((x) => x.notificationId === normalizedNotification.notificationId);
            return [
              normalizedNotification,
              ...prev.filter((x) => x.notificationId !== normalizedNotification.notificationId),
            ];
          });

          if (isNew) {
            seenIdsRef.current.add(normalizedNotification.notificationId);
            queuePopup(normalizedNotification);
          }
        },
        onUnreadCount: (count) => {
          if (openRef.current) {
            return;
          }
          setUnreadCount(count);
        },
        onError: () => {
          if (stream) {
            stream.close();
            stream = null;
          }
          startPolling();
        },
      });
    } else {
      startPolling();
    }

    const handleFocusRefresh = async () => {
      await loadNotifications({ allowPopups: true });
    };

    window.addEventListener("focus", handleFocusRefresh);

    return () => {
      mounted = false;
      window.removeEventListener("focus", handleFocusRefresh);
      stopPolling();
      if (stream) {
        stream.close();
      }
    };
  }, [shouldStartLiveUpdates, enableStream]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (markAllInFlightRef.current) {
      return;
    }

    const hasUnread = items.some((item) => !item.isRead);
    if (!hasUnread) {
      return;
    }

    let cancelled = false;
    markAllInFlightRef.current = true;

    const unreadIds = items.filter((item) => !item.isRead).map((item) => item.notificationId);
    unreadIds.forEach((id) => viewedIdsRef.current.add(id));
    setItems((prev) => prev.map((entry) => (entry.isRead ? entry : { ...entry, isRead: true })));
    setUnreadCount(0);

    const markAllViewed = async () => {
      try {
        const unreadCountFromServer = await markAllNotificationsRead();
        if (cancelled) {
          return;
        }

        if (typeof unreadCountFromServer === "number") {
          setUnreadCount(Math.max(0, unreadCountFromServer));
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Failed to mark notifications as read", error);
        }
      } finally {
        markAllInFlightRef.current = false;
      }
    };

    markAllViewed();

    return () => {
      cancelled = true;
    };
  }, [open, items]);

  const latestFive = useMemo(() => items.slice(0, 5), [items]);

  const removePopup = (notificationId) => {
    setPopupItems((prev) => prev.filter((item) => item.notificationId !== notificationId));
  };

  const handleNotificationAction = async (item) => {
    if (!item) return;

    viewedIdsRef.current.add(item.notificationId);

    if (!item.isRead) {
      try {
        const unreadCountFromServer = await markNotificationRead(item.notificationId);
        setItems((prev) =>
            prev.map((entry) =>
                entry.notificationId === item.notificationId
                    ? { ...entry, isRead: true }
                    : entry
            )
        );
        if (typeof unreadCountFromServer === "number") {
          setUnreadCount(Math.max(0, unreadCountFromServer));
        } else {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch {
        // Continue navigation even if read-state update fails.
      }
    }

    try {
      if (typeof onNotificationClick === "function") {
        onNotificationClick(item);
      } else if (item.postId) {
        navigate(`/home?postId=${item.postId}`);
      }

      setOpen(false);
      removePopup(item.notificationId);
    } catch {
      // Silent fail to keep UX smooth.
    }
  };

  return (
      <div className="notif-widget">
        <button
            type="button"
            className="notif-trigger"
            onClick={() => setOpen((prev) => !prev)}
        >
          <span className="notif-dot" />
          Notifications
          {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
        </button>

        {open && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-title">Preference Alerts</div>

              {latestFive.length === 0 ? (
                  <p className="notif-empty">No notifications yet.</p>
              ) : (
                  latestFive.map((item) => (
                      <button
                          type="button"
                          key={item.notificationId}
                          className={`notif-item ${item.isRead ? "is-read" : ""}`}
                          onClick={() => handleNotificationAction(item)}
                      >
                        <div className="notif-item-row">
                          <span className="notif-interest">{formatInterest(item.learningPreference)}</span>
                          <span className="notif-time">{timeAgo(item.createdAt)}</span>
                        </div>
                        <p className="notif-message">{item.message}</p>
                      </button>
                  ))
              )}
            </div>
        )}

        <div className="notif-popup-stack" aria-live="polite">
          {popupItems.map((popup) => (
              <div className="notif-popup" key={popup.notificationId}>
                <button
                    type="button"
                    className="notif-popup-close"
                    onClick={() => removePopup(popup.notificationId)}
                    aria-label="Close notification"
                >
                  ×
                </button>
                <p className="notif-popup-title">New Post Alert</p>
                <p className="notif-popup-body">{popup.message}</p>
                <div className="notif-popup-actions">
                  <button
                      type="button"
                      className="notif-popup-view"
                      onClick={() => handleNotificationAction(popup)}
                  >
                    View Post
                  </button>
                </div>
              </div>
          ))}
        </div>
      </div>
  );
}
