import React, { useState } from "react";

const defaultForm = {
  title: "",
  description: "",
  difficulty: "MEDIUM",
  deadline: "",
  xpReward: "",
  assignedUserId: "",
  subTaskTitles: "",
};

const MIN_DESCRIPTION_LENGTH = 20;

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

const TaskAdminPanel = ({ users, onSubmit, loading }) => {
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const todayDate = getTodayDateString();
  const descriptionLength = form.description.trim().length;

  const handleChange = (field, value) => {
    const nextValue = field === "xpReward" ? value.replace(/[^\d]/g, "") : value;
    setForm((current) => ({ ...current, [field]: nextValue }));
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }
    if (!form.assignedUserId) {
      setError("Choose a user to assign the task.");
      return;
    }
    if (form.description.trim().length < MIN_DESCRIPTION_LENGTH) {
      setError(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`);
      return;
    }
    if (!form.deadline) {
      setError("Deadline is required.");
      return;
    }
    if (form.deadline < todayDate) {
      setError("Deadline cannot be a past date.");
      return;
    }
    if (form.xpReward && !/^\d+$/.test(form.xpReward)) {
      setError("XP reward must contain numbers only.");
      return;
    }
    if (form.xpReward && Number(form.xpReward) <= 0) {
      setError("XP reward must be greater than zero.");
      return;
    }

    setError("");
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      difficulty: form.difficulty,
      deadline: form.deadline,
      xpReward: form.xpReward ? Number(form.xpReward) : null,
      assignedUserId: Number(form.assignedUserId),
      subTaskTitles: form.subTaskTitles
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    await onSubmit(payload);
    setForm(defaultForm);
  };

  return (
    <section className="task-card">
      <div className="section-kicker">Admin Panel</div>
      <div className="section-head">
        <div>
          <h2>Assign learning tasks</h2>
          <p>Create structured work with reward-ready XP and deadlines.</p>
        </div>
        <div className="task-chip">Uni Learn Hub</div>
      </div>

      <form className="task-form-grid" onSubmit={handleSubmit}>
        <label className="task-field task-field-wide">
          <span>Task title</span>
          <input
            value={form.title}
            onChange={(event) => handleChange("title", event.target.value)}
            placeholder="Prepare database normalization notes"
          />
        </label>

        <label className="task-field task-field-wide">
          <span>Description</span>
          <textarea
            rows="4"
            value={form.description}
            onChange={(event) => handleChange("description", event.target.value)}
            placeholder='Explain the learning goal and what "done" looks like.'
          />
          <small className="task-muted">
            Minimum {MIN_DESCRIPTION_LENGTH} characters. Current: {descriptionLength}
          </small>
        </label>

        <label className="task-field">
          <span>Difficulty</span>
          <select value={form.difficulty} onChange={(event) => handleChange("difficulty", event.target.value)}>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </label>

        <label className="task-field">
          <span>Deadline</span>
          <input
            type="date"
            min={todayDate}
            value={form.deadline}
            onChange={(event) => handleChange("deadline", event.target.value)}
          />
        </label>

        <label className="task-field">
          <span>XP reward</span>
          <input
            type="text"
            inputMode="numeric"
            value={form.xpReward}
            onChange={(event) => handleChange("xpReward", event.target.value)}
            placeholder="75"
          />
        </label>

        <label className="task-field">
          <span>Assign user</span>
          <select value={form.assignedUserId} onChange={(event) => handleChange("assignedUserId", event.target.value)}>
            <option value="">Select a learner</option>
            {users.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.firstname} {user.lastName}
              </option>
            ))}
          </select>
        </label>

        <label className="task-field task-field-wide">
          <span>Subtasks</span>
          <textarea
            rows="5"
            value={form.subTaskTitles}
            onChange={(event) => handleChange("subTaskTitles", event.target.value)}
            placeholder={"Write one subtask per line\nDraft notes\nCreate examples\nReview submission"}
          />
        </label>

        {error ? <p className="task-inline-error">{error}</p> : null}

        <button className="task-primary-btn" disabled={loading} type="submit">
          {loading ? "Assigning..." : "Assign Task"}
        </button>
      </form>
    </section>
  );
};

export default TaskAdminPanel;
