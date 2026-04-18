import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import logo from "../assets/logo.png";
import "../pages/Home.css";
import "./TaskHub.css";
import TaskList from "./TaskList";
import TaskCreate from "./TaskCreate ";

const backgroundDecor = (
  <>
    <div className="light-bg-gradient" />
    <div className="grain-overlay" />
    <div className="color-ribbon color-ribbon-1" />
    <div className="color-ribbon color-ribbon-2" />
    <div className="color-ribbon color-ribbon-3" />
    <div className="glow-orb glow-orb-1" />
    <div className="glow-orb glow-orb-2" />
    <div className="glow-orb glow-orb-3" />
  </>
);

const userNavItems = [
  { label: "Profile", path: "/profile" },
  { label: "Resources", path: "/resources" },
  { label: "Support", path: "/SupportUser" },
  { label: "Review", path: "/Review" },
  { label: "Tasks", path: "/taskPage" },
];
const MIN_TASK_DESCRIPTION_LENGTH = 20;

function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

const TaskPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [subTaskTitles, setSubTaskTitles] = useState([""]);
  const [loading, setLoading] = useState(true);
  const [creatingOwnTask, setCreatingOwnTask] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const getErrorMessage = (requestError, fallbackMessage) => {
    const responseData = requestError.response?.data;
    if (typeof responseData === "string" && responseData.trim()) {
      return responseData;
    }
    if (responseData?.message) {
      return responseData.message;
    }
    return fallbackMessage;
  };

  const profileFullName = useMemo(() => {
    const first = profile?.name || profile?.firstname || "";
    const last = profile?.lastName || "";
    return `${first} ${last}`.trim();
  }, [profile]);

  const ownTasks = useMemo(() => {
    return tasks.filter((task) => !task.assignedBy || task.assignedBy === profileFullName);
  }, [profileFullName, tasks]);

  const ownOpenTaskCount = useMemo(
    () => ownTasks.filter((task) => !task.complete).length,
    [ownTasks]
  );
  const nextUnlock = dashboard?.unlocks?.find((unlock) => !unlock.unlocked);

  const loadPage = async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
    }

    try {
      setError("");
      const [profileResponse, tasksResponse, dashboardResponse] = await Promise.all([
        api.get("/user/me"),
        api.get("/tasks/my"),
        api.get("/tasks/dashboard"),
      ]);

      setProfile(profileResponse.data);
      setTasks(Array.isArray(tasksResponse.data) ? tasksResponse.data : []);
      setDashboard(dashboardResponse.data);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError(requestError.response?.data?.message || "Unable to load your task space.");
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadPage();
  }, [navigate]);

  const refreshAll = async () => {
    await loadPage(false);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this personal task?")) {
      return;
    }

    try {
      setActionError("");
      await api.delete(`/tasks/maintask/${taskId}`);
      setTasks((current) => current.filter((task) => task.id !== taskId));
      await refreshAll();
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, "Unable to delete that task."));
    }
  };

  const handleDeleteSubTask = async (subTaskId) => {
    if (!window.confirm("Delete this subtask?")) {
      return;
    }

    try {
      setActionError("");
      await api.delete(`/tasks/subtask/${subTaskId}`);
      await refreshAll();
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, "Unable to delete that subtask."));
    }
  };

  const handleUpdateSubTaskStatus = async (subTaskId, status) => {
    try {
      setActionError("");
      await api.put(`/tasks/subtask/${subTaskId}/status`, null, { params: { status } });
      await refreshAll();
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, "Unable to update that subtask."));
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      setActionError("");
      await api.post(`/tasks/${taskId}/complete`);
      await refreshAll();
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, "Unable to complete that task."));
    }
  };

  const addSubTaskInput = () => {
    setSubTaskTitles((current) => [...current, ""]);
  };

  const handleSubTaskChange = (index, value) => {
    setSubTaskTitles((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const validateOwnTask = () => {
    if (!newTaskTitle.trim()) {
      return "Task title is required.";
    }
    if (taskDescription.trim().length < MIN_TASK_DESCRIPTION_LENGTH) {
      return `Description must be at least ${MIN_TASK_DESCRIPTION_LENGTH} characters.`;
    }
    if (!startDate) {
      return "Start date is required.";
    }

    const todayDate = getTodayDateString();
    if (startDate < todayDate) {
      return "Start date must be today or a future date.";
    }
    if (!endDate) {
      return "End date is required.";
    }
    if (startDate >= endDate) {
      return "End date must be later than the start date.";
    }

    return "";
  };

  const handleCreateOwnTask = async () => {
    const validationError = validateOwnTask();
    if (validationError) {
      setActionError(validationError);
      return;
    }

    try {
      setCreatingOwnTask(true);
      setActionError("");
      await api.post("/tasks/create", {
        mainTask: {
          title: newTaskTitle,
          description: taskDescription,
          difficulty,
          startDate,
          endDate,
        },
        subTasks: subTaskTitles
          .map((title) => title.trim())
          .filter(Boolean)
          .map((title) => ({ title })),
      });

      setNewTaskTitle("");
      setTaskDescription("");
      setDifficulty("MEDIUM");
      setStartDate("");
      setEndDate("");
      setSubTaskTitles([""]);
      await refreshAll();
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        navigate("/login");
        return;
      }
      setActionError(getErrorMessage(requestError, "Unable to create your task."));
    } finally {
      setCreatingOwnTask(false);
    }
  };

  if (loading) {
    return (
      <div className="modern-home-page">
        {backgroundDecor}
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="uni-task-spinner" />
            <p className="text-[#827a71] font-medium tracking-wide">Loading your task space...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-home-page">
        {backgroundDecor}
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="premium-glass rounded-3xl px-6 py-5 text-center">
            <p className="task-inline-error">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-home-page">
      {backgroundDecor}

      <main className="site-shell pt-6 pb-8 min-h-screen flex flex-col gap-6">
        <header
          className="premium-glass top-nav-shell rounded-full px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 animate-in"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer" onClick={() => navigate("/home")}>
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-lg shadow-[#5f3920]/20 transition-all duration-300">
              <img src={logo} alt="Uni Learn Hub logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col text-center md:text-left">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight">
                Uni Learn Hub
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest">
                Task Space
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-2 lg:gap-3">
            {userNavItems.map((item) => (
              <button
                key={item.label}
                className="nav-pill text-xs sm:text-sm"
                onClick={() => navigate(item.path)}
                type="button"
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </header>

        <section
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in"
          style={{ animationDelay: "220ms" }}
        >
          <div className="lg:col-span-2 premium-glass welcome-surface rounded-3xl p-6 lg:p-8 relative overflow-hidden">
            <span className="welcome-accent-dot welcome-accent-dot-1" />
            <span className="welcome-accent-dot welcome-accent-dot-2" />
            <span className="welcome-accent-dot welcome-accent-dot-4" />

            <div className="relative z-10 w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-[#e8e4db] text-[#876d47] text-[11px] font-bold tracking-[0.15em] uppercase mb-4 shadow-sm w-fit">
                <span className="w-2 h-2 rounded-full bg-[#b49060] animate-pulse"></span>
                Create Task
              </div>
              <h2 className="text-2xl md:text-4xl lg:text-3xl font-extrabold mb-3 tracking-tight text-[#2d2926]">
                Plan your own study work
              </h2>
              <p className="text-[#5c544d] text-base lg:text-lg font-medium max-w-2xl leading-relaxed mb-6">
                Keep your personal tasks here and move to the assigned page for admin work, rewards, and unlocks.
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
                <button
                  onClick={() => navigate("/assigned-tasks")}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-[0_4px_10px_rgba(180,144,96,0.3)] hover:shadow-[0_6px_15px_rgba(180,144,96,0.4)] hover:-translate-y-0.5 transition-all outline-none"
                  type="button"
                >
                  View Assigned Tasks
                </button>
                <button
                  onClick={() => navigate("/home")}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-[#876d47] border border-[#e8e4db] font-bold text-sm shadow-sm hover:bg-[#faf5eb] transition-all outline-none"
                  type="button"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 grid grid-cols-1 gap-4">
            <div className="premium-glass stat-card-pop rounded-3xl p-4 sm:p-6 relative overflow-hidden" data-tone="amber">
              <p className="text-[#827a71] text-xs font-bold uppercase tracking-widest mb-1">My Tasks</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2d2926]">{ownTasks.length}</h3>
              <p className="text-[#b49060] text-xs sm:text-sm font-semibold mt-1">Personal task count</p>
            </div>

            <div className="premium-glass stat-card-pop rounded-3xl p-4 sm:p-6 relative overflow-hidden" data-tone="sage">
              <p className="text-[#827a71] text-xs font-bold uppercase tracking-widest mb-1">Open Tasks</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2d2926]">{ownOpenTaskCount}</h3>
              <p className="text-[#876d47] text-xs sm:text-sm font-semibold mt-1">Personal tasks still in progress</p>
            </div>

            <div className="premium-glass stat-card-pop rounded-3xl p-4 sm:p-6 relative overflow-hidden" data-tone="rose">
              <p className="text-[#827a71] text-xs font-bold uppercase tracking-widest mb-1">Total XP</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2d2926]">{dashboard?.xpPoints ?? 0}</h3>
              <p className="text-[#876d47] text-xs sm:text-sm font-semibold mt-1">Progress from all completed tasks</p>
            </div>

            <div className="premium-glass stat-card-pop rounded-3xl p-4 sm:p-6 relative overflow-hidden" data-tone="ink">
              <p className="text-[#827a71] text-xs font-bold uppercase tracking-widest mb-1">Next Unlock</p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#2d2926]">{nextUnlock?.title || "All Open"}</h3>
              <p className="text-[#876d47] text-xs sm:text-sm font-semibold mt-1">
                {nextUnlock ? `${nextUnlock.requiredXp} XP needed` : "All game modes are ready"}
              </p>
            </div>
          </div>
        </section>

        {actionError ? (
          <section className="task-card task-feedback-strip">
            <p className="task-inline-error">{actionError}</p>
          </section>
        ) : null}

        <section
          className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 items-start animate-in"
          style={{ animationDelay: "320ms" }}
        >
          <section className="task-card">
            <div className="section-kicker">Create Task</div>
            <div className="section-head">
              <div>
                <h2>Create your own tasks</h2>
                <p>Build a personal task list that stays separate from admin-assigned work.</p>
              </div>
              <div className="task-chip">{creatingOwnTask ? "Saving..." : "Personal flow"}</div>
            </div>

            <TaskCreate
              addSubTaskInput={addSubTaskInput}
              difficulty={difficulty}
              endDate={endDate}
              handleCreateTask={handleCreateOwnTask}
              handleSubTaskChange={handleSubTaskChange}
              newTaskTitle={newTaskTitle}
              setDifficulty={setDifficulty}
              setEndDate={setEndDate}
              setNewTaskTitle={setNewTaskTitle}
              setStartDate={setStartDate}
              setTaskDescription={setTaskDescription}
              startDate={startDate}
              subTaskTitles={subTaskTitles}
              taskDescription={taskDescription}
            />
          </section>

          <TaskList
            emptyText="You have not created any personal tasks yet."
            onCompleteTask={handleCompleteTask}
            onDeleteSubTask={handleDeleteSubTask}
            onDeleteTask={handleDeleteTask}
            onUpdateSubTaskStatus={handleUpdateSubTaskStatus}
            tasks={ownTasks}
            title="My personal tasks"
          />
        </section>
      </main>
    </div>
  );
};

export default TaskPage;
