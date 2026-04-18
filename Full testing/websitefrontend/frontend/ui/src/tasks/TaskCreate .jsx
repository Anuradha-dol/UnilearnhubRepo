import React from "react";

const MIN_DESCRIPTION_LENGTH = 20;

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

const TaskCreate = ({
  newTaskTitle,
  setNewTaskTitle,
  taskDescription,
  setTaskDescription,
  difficulty,
  setDifficulty,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  subTaskTitles,
  handleSubTaskChange,
  addSubTaskInput,
  handleCreateTask,
}) => {
  const todayDate = getTodayDateString();
  const descriptionLength = taskDescription.trim().length;

  return (
    <div className="task-form-grid">
      <label className="task-field task-field-wide">
        <span>Task title</span>
        <input
          value={newTaskTitle}
          onChange={(event) => setNewTaskTitle(event.target.value)}
          placeholder="What needs to be done?"
        />
      </label>

      <label className="task-field task-field-wide">
        <span>Description</span>
        <textarea
          rows="4"
          value={taskDescription}
          onChange={(event) => setTaskDescription(event.target.value)}
          placeholder='Add a short note about what "done" means'
        />
        <small className="task-muted">
          Minimum {MIN_DESCRIPTION_LENGTH} characters. Current: {descriptionLength}
        </small>
      </label>

      <label className="task-field">
        <span>Difficulty</span>
        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </label>

      <label className="task-field">
        <span>Start date</span>
        <input
          type="date"
          min={todayDate}
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
      </label>

      <label className="task-field">
        <span>End date</span>
        <input
          type="date"
          min={startDate || todayDate}
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </label>

      <div className="task-note-card">
        <span className="task-note-label">Quick note</span>
        <strong>Personal tasks stay here.</strong>
        <p>Admin-assigned work stays on the assigned tasks page so both spaces stay clean.</p>
      </div>

      <div className="task-field task-field-wide">
        <span>Subtasks</span>
        <div className="task-subtask-inputs">
          {subTaskTitles.map((title, index) => (
            <input
              key={index}
              value={title}
              onChange={(event) => handleSubTaskChange(index, event.target.value)}
              placeholder={`Subtask ${index + 1}`}
            />
          ))}
        </div>
        <button
          onClick={addSubTaskInput}
          type="button"
          className="task-inline-link"
        >
          Add another subtask
        </button>
      </div>

      <button
        onClick={handleCreateTask}
        type="button"
        className="task-primary-btn task-field-wide"
      >
        Create Task
      </button>
    </div>
  );
};

export default TaskCreate;
