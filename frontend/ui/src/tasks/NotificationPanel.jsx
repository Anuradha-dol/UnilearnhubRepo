import React from "react";
import api from "../api";

const NotificationPanel = ({ notifications, onRefresh }) => {
  const clearNotification = async (id) => {
    await api.delete(`/tasks/notifications/${id}`);
    await onRefresh();
  };

  return (
    <section className="task-card">
      <div className="section-kicker">Notifications</div>
      <div className="section-head">
        <div>
          <h2>Task alerts</h2>
          <p>Deadlines, unlocks, reward drops, and game availability.</p>
        </div>
        <div className="task-chip">{notifications.length} unread</div>
      </div>

      {notifications.length === 0 ? (
        <div className="task-empty-state">
          <strong>All clear</strong>
          <p>No unread task notifications right now.</p>
        </div>
      ) : (
        <div className="task-notification-list">
          {notifications.map((notification) => (
            <div className="task-notification-item" key={notification.id}>
              <div>
                <strong>{notification.message}</strong>
                <p>{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : "Just now"}</p>
              </div>
              <button className="task-icon-btn" onClick={() => clearNotification(notification.id)} type="button">
                Clear
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default NotificationPanel;
