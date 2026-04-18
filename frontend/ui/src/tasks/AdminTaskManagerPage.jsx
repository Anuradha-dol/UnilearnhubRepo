import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import logo from "../assets/logo.png";
import "../pages/Home.css";
import "./TaskHub.css";
import TaskAdminPanel from "./TaskAdminPanel";
import TaskList from "./TaskList";

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

const AdminTaskManagerPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  const loadPage = async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
    }

    try {
      const [usersResponse, tasksResponse] = await Promise.all([
        api.get("/tasks/admin/users"),
        api.get("/tasks/admin/assigned"),
      ]);

      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
      setAssignedTasks(Array.isArray(tasksResponse.data) ? tasksResponse.data : []);
      setError("");
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        navigate("/login");
        return;
      }
      if (requestError.response?.status === 403) {
        setError("Access denied (Admin only)");
      } else {
        setError(requestError.response?.data?.message || "Unable to load the admin task manager.");
      }
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadPage();
  }, [navigate]);

  const handleAdminCreate = async (payload) => {
    try {
      setSubmitting(true);
      setActionError("");
      await api.post("/tasks/admin/assign", payload);
      await loadPage(false);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, "Unable to assign that task right now."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this admin-assigned task?")) {
      return;
    }

    try {
      setActionError("");
      await api.delete(`/tasks/admin/${taskId}`);
      setAssignedTasks((current) => current.filter((task) => task.id !== taskId));
      await loadPage(false);
    } catch (requestError) {
      setActionError(getErrorMessage(requestError, "Unable to delete that admin-assigned task."));
    }
  };

  if (loading) {
    return (
      <div className="modern-home-page">
        {backgroundDecor}
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="uni-task-spinner" />
            <p className="text-[#827a71] font-medium tracking-wide">Loading admin task manager...</p>
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
          <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-lg shadow-[#5f3920]/20 transition-all duration-300">
              <img src={logo} alt="Uni Learn Hub logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col text-center md:text-left">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-[#2d2926] leading-tight">
                Uni Learn Hub Admin
              </h1>
              <p className="text-xs font-semibold text-[#b49060] uppercase tracking-widest">
                Task Manager
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-2 lg:gap-3">
            <button className="nav-pill text-xs sm:text-sm" onClick={() => navigate("/profile")} type="button">
              Profile
            </button>
            <button className="nav-pill text-xs sm:text-sm" onClick={() => navigate("/SupportAdmin")} type="button">
              Support
            </button>
            <button className="nav-pill text-xs sm:text-sm" onClick={() => navigate("/resources-management")} type="button">
              Resources
            </button>
            <button className="nav-pill text-xs sm:text-sm" onClick={() => navigate("/dashboard")} type="button">
              Dashboard
            </button>
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
                Admin Create Task
              </div>
              <h2 className="text-2xl md:text-4xl lg:text-3xl font-extrabold mb-3 tracking-tight text-[#2d2926]">
                Create and manage assigned tasks
              </h2>
              <p className="text-[#5c544d] text-base lg:text-lg font-medium max-w-2xl leading-relaxed mb-6">
                Assign work to learners, review active admin tasks, and remove assignments cleanly from one place.
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-[0_4px_10px_rgba(180,144,96,0.3)] hover:shadow-[0_6px_15px_rgba(180,144,96,0.4)] hover:-translate-y-0.5 transition-all outline-none"
                  type="button"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => loadPage(false)}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-[#876d47] border border-[#e8e4db] font-bold text-sm shadow-sm hover:bg-[#faf5eb] transition-all outline-none"
                  type="button"
                >
                  Refresh Tasks
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 grid grid-cols-1 gap-4">
            <div className="premium-glass stat-card-pop rounded-3xl p-4 sm:p-6 relative overflow-hidden" data-tone="amber">
              <p className="text-[#827a71] text-xs font-bold uppercase tracking-widest mb-1">Learners</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2d2926]">{users.length}</h3>
              <p className="text-[#b49060] text-xs sm:text-sm font-semibold mt-1">Available for assignment</p>
            </div>

            <div className="premium-glass stat-card-pop rounded-3xl p-4 sm:p-6 relative overflow-hidden" data-tone="sage">
              <p className="text-[#827a71] text-xs font-bold uppercase tracking-widest mb-1">Assigned Tasks</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2d2926]">{assignedTasks.length}</h3>
              <p className="text-[#876d47] text-xs sm:text-sm font-semibold mt-1">Admin-created tasks in the system</p>
            </div>
          </div>
        </section>

        {actionError ? (
          <section className="task-card task-feedback-strip">
            <p className="task-inline-error">{actionError}</p>
          </section>
        ) : null}

        <div className="task-admin-grid">
          <TaskAdminPanel loading={submitting} onSubmit={handleAdminCreate} users={users} />
          <TaskList
            adminView
            emptyText="No admin-created tasks yet."
            onDeleteTask={handleDeleteTask}
            tasks={assignedTasks}
            title="Admin assigned tasks"
          />
        </div>
      </main>
    </div>
  );
};

export default AdminTaskManagerPage;
