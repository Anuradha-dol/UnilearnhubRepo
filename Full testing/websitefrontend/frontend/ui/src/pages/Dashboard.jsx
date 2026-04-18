import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import logo from "../assets/logo.png";
import "./Home.css";

function formatDate(value) {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function parseDateOnly(value) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDisplayName(user) {
  if (!user) {
    return "Not assigned";
  }

  const fullName = [user.firstname, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.email || "Not assigned";
}

function getDifficultyLabel(value) {
  if (!value) {
    return "Not set";
  }

  return value.charAt(0) + value.slice(1).toLowerCase();
}

function getStatusMeta(task, today) {
  if (task.complete) {
    return {
      label: "Completed",
      className: "bg-[#ebf5ed] text-[#5b7a62] border-[#cfe3d3]",
    };
  }

  const dueDate = parseDateOnly(task.endDate);
  if (dueDate && dueDate < today) {
    return {
      label: "Overdue",
      className: "bg-[#fcf1ef] text-[#c36254] border-[#f0c3be]",
    };
  }

  if (dueDate) {
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
    if (daysRemaining <= 3) {
      return {
        label: "Due Soon",
        className: "bg-[#fff5e8] text-[#9a6d2d] border-[#ecd6aa]",
      };
    }
  }

  return {
    label: "In Progress",
    className: "bg-[#f7f1e9] text-[#7b6d5c] border-[#e1d6c7]",
  };
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [resourceCount, setResourceCount] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [dashboardResponse, usersResponse, tasksResponse] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/tasks/admin/users"),
          api.get("/tasks/admin/assigned"),
        ]);

        setData(dashboardResponse.data);
        setAssignableUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
        setAssignedTasks(Array.isArray(tasksResponse.data) ? tasksResponse.data : []);
        setError("");
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
        } else if (err.response?.status === 403) {
          setError("Access denied (Admin only)");
        } else {
          setError(err.response?.data?.message || "Failed to load dashboard");
        }
      }
    };

    loadDashboard();
  }, [navigate]);

  useEffect(() => {
    const loadResourceCount = async () => {
      try {
        const videosResponse = await api.get("/api/videos/my", { withCredentials: true });
        const videos = Array.isArray(videosResponse.data) ? videosResponse.data : [];
        setResourceCount(videos.length);
      } catch (err) {
        console.error("Failed to load resource count:", err);
        setResourceCount(0);
      }
    };

    loadResourceCount();
  }, []);

  if (error) {
    return (
      <div className="modern-home-page flex items-center justify-center min-h-screen">
        <div className="premium-glass p-8 rounded-2xl text-red-800 font-medium">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="modern-home-page flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#e8e4db] border-t-[#b49060] animate-spin"></div>
          <p className="text-[#827a71] font-medium tracking-wide">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const actions = [
    {
      label: "Profile",
      caption: "Open admin profile",
      onClick: () => navigate("/profile"),
    },
    {
      label: "Support",
      caption: "Open support inbox",
      onClick: () => navigate("/SupportAdmin"),
    },
    {
      label: "Resources",
      caption: "Manage learning resources",
      onClick: () => navigate("/resources-management"),
    },
    {
      label: "Admin Tasks",
      caption: "Assign and review tasks",
      onClick: () => navigate("/admin-task-manager"),
    },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalAssignedTasks = assignedTasks.length;
  const completedAssignedTasks = assignedTasks.filter((task) => task.complete).length;
  const activeAssignedTasks = totalAssignedTasks - completedAssignedTasks;
  const overdueTasks = assignedTasks.filter((task) => {
    const dueDate = parseDateOnly(task.endDate);
    return !task.complete && dueDate && dueDate < today;
  }).length;
  const dueSoonTasks = assignedTasks.filter((task) => {
    const dueDate = parseDateOnly(task.endDate);
    if (task.complete || !dueDate || dueDate < today) {
      return false;
    }

    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
    return daysRemaining <= 7;
  }).length;
  const coveredUsers = new Set(
    assignedTasks.map((task) => task.user?.userId).filter(Boolean)
  ).size;
  const completionRate = totalAssignedTasks
    ? Math.round((completedAssignedTasks / totalAssignedTasks) * 100)
    : 0;
  const notificationCount = typeof data.notifications === "number" ? data.notifications : 0;

  const recentAssignments = [...assignedTasks]
    .sort((left, right) => {
      const leftTime = new Date(left.createdAt || 0).getTime();
      const rightTime = new Date(right.createdAt || 0).getTime();
      return rightTime - leftTime;
    })
    .slice(0, 5);

  const nextDueTask = [...assignedTasks]
    .filter((task) => !task.complete && parseDateOnly(task.endDate))
    .sort((left, right) => {
      const leftTime = parseDateOnly(left.endDate)?.getTime() || 0;
      const rightTime = parseDateOnly(right.endDate)?.getTime() || 0;
      return leftTime - rightTime;
    })[0] || null;

  const difficultyCounts = assignedTasks.reduce(
    (counts, task) => {
      if (task.difficulty && counts[task.difficulty] !== undefined) {
        counts[task.difficulty] += 1;
      }
      return counts;
    },
    { EASY: 0, MEDIUM: 0, HARD: 0 }
  );

  const difficultyItems = [
    {
      label: "Easy",
      value: difficultyCounts.EASY,
      className: "bg-[#f7f3ed] text-[#7a6956]",
    },
    {
      label: "Medium",
      value: difficultyCounts.MEDIUM,
      className: "bg-[#fff5e8] text-[#9a6d2d]",
    },
    {
      label: "Hard",
      value: difficultyCounts.HARD,
      className: "bg-[#fcf1ef] text-[#c36254]",
    },
  ];

  const visibleUsers = assignableUsers.slice(0, 5);
  const remainingUsers = Math.max(assignableUsers.length - visibleUsers.length, 0);

  return (
    <div className="modern-home-page">
      <div className="light-bg-gradient" />
      <div className="grain-overlay" />
      <div className="color-ribbon color-ribbon-1" />
      <div className="color-ribbon color-ribbon-2" />
      <div className="color-ribbon color-ribbon-3" />
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <div className="glow-orb glow-orb-3" />

      <main className="site-shell pt-6 pb-10 min-h-screen flex flex-col gap-6">
        <header
          className="premium-glass top-nav-shell rounded-full px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 animate-in"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-lg shadow-[#5f3920]/20 transition-all duration-300">
              <img src={logo} alt="Uni Learn Hub logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight">
                Uni Learn Hub Admin
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest">
                Task Control Center
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-2 lg:gap-3">
            {actions.map((action, index) => (
              <button
                key={action.label}
                className="nav-pill text-xs sm:text-sm"
                onClick={action.onClick}
                style={{ animationDelay: `${200 + index * 100}ms` }}
                type="button"
              >
                <span>{action.label}</span>
              </button>
            ))}
          </nav>
        </header>

        <section
          className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_360px] gap-6 animate-in"
          style={{ animationDelay: "210ms" }}
        >
          <div className="premium-glass admin-command-surface rounded-[2rem] p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-white/18 blur-3xl pointer-events-none" />
            <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-[#b49060]/12 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-8">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/75 border border-[#e8e4db] text-[#876d47] text-[11px] font-bold tracking-[0.15em] uppercase mb-4 shadow-sm w-fit">
                    <span className="w-2 h-2 rounded-full bg-[#b49060] animate-pulse"></span>
                    Live Admin Summary
                  </div>
                  <h2 className="text-3xl md:text-4xl xl:text-[2.7rem] font-extrabold tracking-tight text-[#2d2926] leading-tight">
                    {data.welcomeMessage || "Admin workspace ready"}
                  </h2>
                  <p className="text-[#5c544d] text-base lg:text-lg font-medium max-w-2xl leading-relaxed mt-4">
                    Monitor real assignment flow, watch completion health, and move directly into support, resource control, or task assignment without leaving the dashboard.
                  </p>
                </div>

                <div className="admin-spotlight-panel rounded-[1.75rem] p-5 lg:p-6 xl:max-w-[320px] w-full">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#876d47]">
                        Operations Pulse
                      </p>
                      <h3 className="text-2xl font-extrabold text-[#2d2926] mt-2">
                        {completionRate}% completion
                      </h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[#faf5eb] border border-[#e8e4db] flex items-center justify-center text-[#b49060] shrink-0">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m4 6V7m4 10v-3M5 19h14" />
                      </svg>
                    </div>
                  </div>

                  <div className="admin-progress-track mt-5">
                    <div
                      className="admin-progress-fill"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="admin-inline-stat rounded-2xl px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#827a71]">Users Covered</p>
                      <p className="text-lg font-extrabold text-[#2d2926] mt-1">
                        {coveredUsers} / {assignableUsers.length}
                      </p>
                    </div>
                    <div className="admin-inline-stat rounded-2xl px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#827a71]">Open Alerts</p>
                      <p className="text-lg font-extrabold text-[#2d2926] mt-1">{notificationCount}</p>
                    </div>
                    <div className="admin-inline-stat rounded-2xl px-4 py-3 sm:col-span-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#827a71]">Uploaded Resources</p>
                      <p className="text-lg font-extrabold text-[#2d2926] mt-1">{resourceCount}</p>
                    </div>
                  </div>

                  {nextDueTask ? (
                    <div className="mt-5 rounded-[1.4rem] border border-[#eadfca] bg-white/85 px-4 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#876d47]">
                        Next Due Task
                      </p>
                      <p className="text-base font-bold text-[#2d2926] mt-2">{nextDueTask.title}</p>
                      <p className="text-sm text-[#6f675e] mt-1">{getDisplayName(nextDueTask.user)}</p>
                      <p className="text-xs font-semibold text-[#b49060] mt-2">
                        Due {formatDate(nextDueTask.endDate)}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[1.4rem] border border-dashed border-[#d8d1c6] bg-white/55 px-4 py-5 text-sm text-[#827a71]">
                      No upcoming due task is active right now.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/admin-task-manager")}
                  className="premium-glass admin-kpi-card rounded-[1.6rem] p-5 text-left transition-transform hover:-translate-y-1"
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#827a71]">Assigned Tasks</p>
                  <h3 className="text-3xl font-extrabold text-[#2d2926] mt-3">{totalAssignedTasks}</h3>
                  <p className="text-sm font-semibold text-[#876d47] mt-2">Total admin-created assignments</p>
                </button>

                <div className="premium-glass admin-kpi-card rounded-[1.6rem] p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#827a71]">Active Tasks</p>
                  <h3 className="text-3xl font-extrabold text-[#2d2926] mt-3">{activeAssignedTasks}</h3>
                  <p className="text-sm font-semibold text-[#876d47] mt-2">Currently still in progress</p>
                </div>

                <div className="premium-glass admin-kpi-card rounded-[1.6rem] p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#827a71]">Completed</p>
                  <h3 className="text-3xl font-extrabold text-[#2d2926] mt-3">{completedAssignedTasks}</h3>
                  <p className="text-sm font-semibold text-[#876d47] mt-2">Assignments finished by users</p>
                </div>

                <div className="premium-glass admin-kpi-card rounded-[1.6rem] p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#827a71]">Attention Needed</p>
                  <h3 className="text-3xl font-extrabold text-[#2d2926] mt-3">{overdueTasks}</h3>
                  <p className="text-sm font-semibold text-[#876d47] mt-2">{dueSoonTasks} more due within 7 days</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
                <button
                  onClick={() => navigate("/admin-task-manager")}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-[0_8px_22px_rgba(180,144,96,0.28)] hover:-translate-y-0.5 transition-all outline-none"
                  type="button"
                >
                  Open Admin Task Manager
                </button>
                <button
                  onClick={() => navigate("/SupportAdmin")}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white text-[#876d47] border border-[#e8e4db] font-bold text-sm shadow-sm hover:bg-[#faf5eb] transition-all outline-none"
                  type="button"
                >
                  Open Support Inbox
                </button>
                <button
                  onClick={() => navigate("/resources-management")}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:bg-[#faf5eb] hover:text-[#b49060] transition-all outline-none"
                  type="button"
                >
                  Manage Resources
                </button>
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <div className="premium-glass rounded-[2rem] p-5 lg:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#876d47]">Quick Access</p>
                  <h3 className="text-xl font-extrabold text-[#2d2926] mt-1">Admin Navigation</h3>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#faf5eb] border border-[#e8e4db] flex items-center justify-center text-[#b49060]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className="admin-quick-link rounded-[1.35rem] px-4 py-4 text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-[#2d2926]">{action.label}</div>
                        <div className="text-xs text-[#827a71] mt-1">{action.caption}</div>
                      </div>
                      <svg className="w-5 h-5 text-[#b49060]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="premium-glass rounded-[2rem] p-5 lg:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#876d47]">Assignment Reach</p>
                  <h3 className="text-xl font-extrabold text-[#2d2926] mt-1">Team Coverage</h3>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-[#faf5eb] border border-[#e8e4db] text-xs font-bold text-[#876d47]">
                  {assignableUsers.length} users
                </span>
              </div>

              <div className="space-y-3">
                <div className="admin-insight-row rounded-[1.35rem] px-4 py-3">
                  <span className="text-sm font-semibold text-[#5c544d]">Users with assignments</span>
                  <span className="text-sm font-extrabold text-[#2d2926]">{coveredUsers}</span>
                </div>
                <div className="admin-insight-row rounded-[1.35rem] px-4 py-3">
                  <span className="text-sm font-semibold text-[#5c544d]">Users without active admin task</span>
                  <span className="text-sm font-extrabold text-[#2d2926]">
                    {Math.max(assignableUsers.length - coveredUsers, 0)}
                  </span>
                </div>
                <div className="admin-insight-row rounded-[1.35rem] px-4 py-3">
                  <span className="text-sm font-semibold text-[#5c544d]">Support notifications</span>
                  <span className="text-sm font-extrabold text-[#2d2926]">{notificationCount}</span>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section
          className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_390px] gap-6 animate-in"
          style={{ animationDelay: "320ms" }}
        >
          <div className="premium-glass rounded-[2rem] p-6 lg:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#876d47]">Real Task Feed</p>
                <h3 className="text-2xl font-extrabold text-[#2d2926] mt-1">Recent Assigned Tasks</h3>
                <p className="text-sm text-[#827a71] mt-1">
                  Latest admin-created assignments with real assignee, deadline, progress, and state.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/admin-task-manager")}
                className="px-4 py-2.5 rounded-full bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:bg-[#faf5eb] hover:text-[#b49060] transition-colors"
              >
                Open Task Manager
              </button>
            </div>

            {recentAssignments.length === 0 ? (
              <div className="rounded-[1.8rem] border border-dashed border-[#d8d1c6] bg-white/55 px-6 py-12 text-center">
                <p className="text-lg font-bold text-[#2d2926]">No admin assignments yet</p>
                <p className="text-sm text-[#827a71] mt-2">
                  Create the first real assignment from the admin task manager.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAssignments.map((task) => {
                  const status = getStatusMeta(task, today);

                  return (
                    <div
                      key={task.id}
                      className="admin-task-row rounded-[1.65rem] p-5"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h4 className="text-lg font-bold text-[#2d2926]">{task.title}</h4>
                            <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-[0.16em] ${status.className}`}>
                              {status.label}
                            </span>
                          </div>
                          {task.description ? (
                            <p className="text-sm text-[#6f675e] mt-2 leading-relaxed">{task.description}</p>
                          ) : (
                            <p className="text-sm text-[#8a8178] mt-2">No description added for this task.</p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1.5 rounded-full bg-[#faf5eb] text-[#876d47] border border-[#e8e4db] text-xs font-bold">
                            {getDifficultyLabel(task.difficulty)}
                          </span>
                          <span className="px-3 py-1.5 rounded-full bg-white text-[#5c544d] border border-[#e8e4db] text-xs font-bold">
                            {(task.subTasks || []).length} subtasks
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                        <div className="admin-detail-tile rounded-[1.2rem] px-4 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#827a71]">Assigned To</p>
                          <p className="text-sm font-bold text-[#2d2926] mt-1">{getDisplayName(task.user)}</p>
                        </div>
                        <div className="admin-detail-tile rounded-[1.2rem] px-4 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#827a71]">Due Date</p>
                          <p className="text-sm font-bold text-[#2d2926] mt-1">{formatDate(task.endDate)}</p>
                        </div>
                        <div className="admin-detail-tile rounded-[1.2rem] px-4 py-3">
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#827a71]">Created</p>
                          <p className="text-sm font-bold text-[#2d2926] mt-1">{formatDate(task.createdAt)}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-semibold text-[#5c544d]">Progress</span>
                          <span className="font-extrabold text-[#2d2926]">{Math.round(task.progress || 0)}%</span>
                        </div>
                        <div className="admin-progress-track mt-2">
                          <div
                            className="admin-progress-fill"
                            style={{ width: `${Math.min(100, Math.max(0, Math.round(task.progress || 0)))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div className="premium-glass rounded-[2rem] p-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#876d47]">Available Team</p>
                  <h3 className="text-2xl font-extrabold text-[#2d2926] mt-1">Assignable Users</h3>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-[#faf5eb] border border-[#e8e4db] text-xs font-bold text-[#876d47]">
                  {assignableUsers.length}
                </span>
              </div>

              {visibleUsers.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-[#d8d1c6] bg-white/55 px-5 py-8 text-center text-sm text-[#827a71]">
                  No assignable users available right now.
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleUsers.map((user) => (
                    <div key={user.userId} className="admin-user-row rounded-[1.35rem] px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#faf5eb] border border-[#e8e4db] flex items-center justify-center text-[#b49060] shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 14a4 4 0 10-8 0m8 0a6 6 0 016 6H2a6 6 0 016-6m8 0a4 4 0 10-8 0" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#2d2926]">{getDisplayName(user)}</p>
                          <p className="text-xs text-[#827a71] mt-1 break-all">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {remainingUsers > 0 ? (
                <p className="text-xs text-[#827a71] mt-4">
                  +{remainingUsers} more users are available inside the admin task manager.
                </p>
              ) : null}
            </div>

            <div className="premium-glass rounded-[2rem] p-6">
              <div className="mb-5">
                <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#876d47]">Workload Shape</p>
                <h3 className="text-2xl font-extrabold text-[#2d2926] mt-1">Difficulty Split</h3>
              </div>

              <div className="space-y-4">
                {difficultyItems.map((item) => {
                  const width = totalAssignedTasks
                    ? `${Math.round((item.value / totalAssignedTasks) * 100)}%`
                    : "0%";

                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${item.className}`}>
                          {item.label}
                        </span>
                        <span className="text-sm font-extrabold text-[#2d2926]">{item.value}</span>
                      </div>
                      <div className="admin-progress-track">
                        <div
                          className="admin-progress-fill"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
