import React, { useEffect, useState } from "react";
import api from "../api";
import "./OngoingTasks.css";

const OngoingTasks = () => {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async () => {
    try {
      const res = await api.get("/tasks/my", { withCredentials: true });
      const ongoingTasks = res.data.filter((task) => !(task.complete ?? task.isComplete));
      setTasks(ongoingTasks);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatRemainingTime = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="ongoing-tasks-container">
      <h2 className="ongoing-tasks-title">Ongoing Tasks</h2>
      <div className="ongoing-tasks-body">
        {tasks.length === 0 ? (
          <div className="ongoing-empty-state">
            <div className="ongoing-empty-badge">All Clear</div>
            <p className="ongoing-empty-message">No ongoing tasks.</p>
            <p className="ongoing-empty-subtext">Create a new task to keep your momentum going.</p>
          </div>
        ) : (
          <div className="ongoing-task-cards">
            {tasks.map((task) => (
              <div className="ongoing-task-card" key={task.id}>
                <h3>{task.title}</h3>
                <div className="task-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${task.progress}%` }} />
                  </div>
                  <span>{task.progress}% Complete</span>
                </div>
                <div className="remaining-time">
                  Remaining Time: {formatRemainingTime(task.endDate)}
                </div>
                {task.subTasks.length > 0 && (
                  <div className="subtasks">
                    <strong>Subtasks:</strong>
                    <ul>
                      {task.subTasks.map((st) => (
                        <li key={st.id}>
                          {st.title} - {st.status}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OngoingTasks;
