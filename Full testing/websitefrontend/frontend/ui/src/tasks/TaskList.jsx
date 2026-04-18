import React from "react";

const difficultyTone = {
  EASY: "task-difficulty-easy",
  MEDIUM: "task-difficulty-medium",
  HARD: "task-difficulty-hard",
};

const formatTaskDate = (value) => {
  if (!value) {
    return "Not set";
  }
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const TaskList = ({
  tasks,
  title,
  emptyText,
  adminView = false,
  onDeleteTask,
  onDeleteSubTask,
  onUpdateSubTaskStatus,
  onCompleteTask,
}) => {
  return (
    <section className="task-card">
      <div className="section-kicker">{adminView ? "Admin View" : "Tasks"}</div>
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          <p>{adminView ? "Everything the admin has assigned across learners." : "Track progress, complete work, and trigger unlocks."}</p>
        </div>
        <div className="task-chip">{tasks.length} task{tasks.length === 1 ? "" : "s"}</div>
      </div>

      {tasks.length === 0 ? (
        <div className="task-empty-state">
          <strong>Nothing here yet</strong>
          <p>{emptyText}</p>
        </div>
      ) : (
        <div className="task-list-wrap">
          {tasks.map((task) => (
            <article className="task-item-card" key={task.id}>
              <div className="task-item-top">
                <div className="task-item-copy">
                  <div className="task-badge-row">
                    <span className={`task-difficulty ${difficultyTone[task.difficulty] || "task-difficulty-medium"}`}>
                      {task.difficulty || "MEDIUM"}
                    </span>
                    <span className="task-chip">+{task.xpReward || 0} XP</span>
                    <span className={`task-chip ${task.complete ? "task-chip-success" : ""}`}>
                      {task.complete ? "Completed" : "In progress"}
                    </span>
                  </div>
                  <h3>{task.title}</h3>
                  <p>{task.description || "No description was added for this task."}</p>
                </div>

                {onDeleteTask ? (
                  <button className="task-icon-btn task-danger-btn" onClick={() => onDeleteTask(task.id)} type="button">
                    Delete
                  </button>
                ) : null}
              </div>

              <div className="task-meta-grid">
                <div>
                  <span>Start</span>
                  <strong>{formatTaskDate(task.startDate)}</strong>
                </div>
                <div>
                  <span>Deadline</span>
                  <strong>{formatTaskDate(task.endDate)}</strong>
                </div>
                <div>
                  <span>Progress</span>
                  <strong>{Math.round(task.progress || 0)}%</strong>
                </div>
                <div>
                  <span>{adminView ? "Assigned to" : "Assigned by"}</span>
                  <strong>
                    {adminView
                      ? `${task.user?.firstname || ""} ${task.user?.lastName || ""}`.trim() || "Unknown learner"
                      : task.assignedBy || "Self managed"}
                  </strong>
                </div>
              </div>

              <div className="task-progress-track">
                <div className="task-progress-fill" style={{ width: `${task.progress || 0}%` }} />
              </div>

              {!adminView && onCompleteTask ? (
                <div className="task-item-actions">
                  <button
                    className="task-primary-btn"
                    disabled={task.complete}
                    onClick={() => onCompleteTask(task.id)}
                    type="button"
                  >
                    {task.complete ? "Task already complete" : "Mark task complete"}
                  </button>
                </div>
              ) : null}

              <div className="task-subtask-list">
                {(task.subTasks || []).length === 0 ? (
                  <p className="task-muted">No subtasks. You can complete this task directly.</p>
                ) : (
                  task.subTasks.map((subTask) => {
                    const isComplete = subTask.status === "COMPLETE";
                    return (
                      <div className="task-subtask-row" key={subTask.id}>
                        <div>
                          <strong>{subTask.title}</strong>
                          <p>{isComplete ? "Complete" : "In process"}</p>
                        </div>

                        {adminView ? (
                          <span className={`task-chip ${isComplete ? "task-chip-success" : ""}`}>{subTask.status}</span>
                        ) : (
                          <div className="task-subtask-actions">
                            <select
                              value={subTask.status || "IN_PROCESS"}
                              onChange={(event) => onUpdateSubTaskStatus(subTask.id, event.target.value)}
                            >
                              <option value="IN_PROCESS">In Process</option>
                              <option value="COMPLETE">Complete</option>
                            </select>

                            {onDeleteSubTask ? (
                              <button className="task-icon-btn" onClick={() => onDeleteSubTask(subTask.id)} type="button">
                                Remove
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default TaskList;
