import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import logo from "../assets/logo.png";
import "../pages/Home.css";
import "./TaskHub.css";
import NotificationPanel from "./NotificationPanel";
import TaskList from "./TaskList";
import RewardUnlockPanel from "./RewardUnlockPanel";
import SubjectQuizGame from "./SubjectQuizGame";
import BusinessGame from "./BusinessGame";

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

const UserAssignedTasksPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
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

  const assignedTasks = useMemo(() => {
    return tasks.filter((task) => task.assignedBy && task.assignedBy !== profileFullName);
  }, [profileFullName, tasks]);

  const nextUnlock = dashboard?.unlocks?.find((unlock) => !unlock.unlocked);

  const loadPage = async (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
    }

    try {
      const [profileResponse, tasksResponse, dashboardResponse, notificationsResponse] = await Promise.all([
        api.get("/user/me"),
        api.get("/tasks/my"),
        api.get("/tasks/dashboard"),
        api.get("/tasks/notifications"),
      ]);

      setProfile(profileResponse.data);
      setTasks(Array.isArray(tasksResponse.data) ? tasksResponse.data : []);
      setDashboard(dashboardResponse.data);
      setNotifications(Array.isArray(notificationsResponse.data) ? notificationsResponse.data : []);
      setError("");
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError(requestError.response?.data?.message || "Unable to load admin-created tasks.");
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

  const findUnlock = (feature) => dashboard?.unlocks?.find((unlock) => unlock.feature === feature);

  if (loading) {
    return (
      <div className="modern-home-page">
        {backgroundDecor}
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="uni-task-spinner" />
            <p className="text-[#827a71] font-medium tracking-wide">Loading assigned tasks...</p>
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
                Assigned Task Space
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
                Assigned Tasks
              </div>
              <h2 className="text-2xl md:text-4xl lg:text-3xl font-extrabold mb-3 tracking-tight text-[#2d2926]">
                Complete assigned work and unlock game time
              </h2>
              <p className="text-[#5c544d] text-base lg:text-lg font-medium max-w-2xl leading-relaxed mb-6">
                Finish admin tasks to raise your XP, level up your progress, and unlock each game when its XP target is reached.
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
                <button
                  onClick={() => navigate("/taskPage")}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-[0_4px_10px_rgba(180,144,96,0.3)] hover:shadow-[0_6px_15px_rgba(180,144,96,0.4)] hover:-translate-y-0.5 transition-all outline-none"
                  type="button"
                >
                  Back to My Tasks
                </button>
                <button
                  onClick={() => navigate("/home")}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-[#876d47] border border-[#e8e4db] font-bold text-sm shadow-sm hover:bg-[#faf5eb] transition-all outline-none"
                  type="button"
                >
                  Go Home
                </button>
                <button
                  onClick={() => setShowNotifications((current) => !current)}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:bg-[#faf5eb] hover:text-[#b49060] transition-all outline-none"
                  type="button"
                >
                  {showNotifications ? "Hide Notifications" : `Notifications (${notifications.length})`}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 grid grid-cols-1 gap-4">
            <div className="premium-glass stat-card-pop rounded-3xl p-4 sm:p-6 relative overflow-hidden" data-tone="amber">
              <p className="text-[#827a71] text-xs font-bold uppercase tracking-widest mb-1">Assigned Tasks</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2d2926]">{assignedTasks.length}</h3>
              <p className="text-[#b49060] text-xs sm:text-sm font-semibold mt-1">Tasks waiting for completion</p>
            </div>

            <div className="premium-glass stat-card-pop rounded-3xl p-4 sm:p-6 relative overflow-hidden" data-tone="sage">
              <p className="text-[#827a71] text-xs font-bold uppercase tracking-widest mb-1">XP Points</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2d2926]">{dashboard?.xpPoints ?? 0}</h3>
              <p className="text-[#876d47] text-xs sm:text-sm font-semibold mt-1">
                {nextUnlock ? `Next unlock: ${nextUnlock.title}` : "All available features unlocked"}
              </p>
            </div>

            <div className="premium-glass stat-card-pop rounded-3xl p-4 sm:p-6 relative overflow-hidden" data-tone="rose">
              <p className="text-[#827a71] text-xs font-bold uppercase tracking-widest mb-1">Completed Tasks</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2d2926]">{dashboard?.completedTasks ?? 0}</h3>
              <p className="text-[#876d47] text-xs sm:text-sm font-semibold mt-1">Finished work that counts toward unlocks</p>
            </div>

            <div className="premium-glass stat-card-pop rounded-3xl p-4 sm:p-6 relative overflow-hidden" data-tone="ink">
              <p className="text-[#827a71] text-xs font-bold uppercase tracking-widest mb-1">Current Level</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2d2926]">{dashboard?.level ?? 1}</h3>
              <p className="text-[#876d47] text-xs sm:text-sm font-semibold mt-1">
                {nextUnlock ? `${nextUnlock.requiredXp} XP needed next` : "All game modes unlocked"}
              </p>
            </div>
          </div>
        </section>

        {actionError ? (
          <section className="task-card task-feedback-strip">
            <p className="task-inline-error">{actionError}</p>
          </section>
        ) : null}

        {showNotifications ? <NotificationPanel notifications={notifications} onRefresh={refreshAll} /> : null}

        <div className="task-layout-grid">
          <div className="task-main-column">
            <TaskList
              emptyText="No admin-created tasks are assigned to you right now."
              onCompleteTask={handleCompleteTask}
              onUpdateSubTaskStatus={handleUpdateSubTaskStatus}
              tasks={assignedTasks}
              title="Tasks assigned by admin"
            />

            <section className="task-game-grid">
              <SubjectQuizGame dashboard={dashboard} onRefresh={refreshAll} unlock={findUnlock("MINI_GAME")} />
              <BusinessGame dashboard={dashboard} onRefresh={refreshAll} unlock={findUnlock("BUSINESS_QUIZ_GAME")} />
              <SubjectQuizGame dashboard={dashboard} onRefresh={refreshAll} unlock={findUnlock("ADVANCED_GAME")} />
            </section>
          </div>

          <div className="task-side-column task-side-column-sticky">
            <RewardUnlockPanel dashboard={dashboard} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserAssignedTasksPage;
