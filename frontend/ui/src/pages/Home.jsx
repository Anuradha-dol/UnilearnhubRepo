import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PostFeed from "../post/PostFeed.jsx";
import OngoingTasks from "../tasks/OngoingTasks ";
import api from "../api";
import logo from "../assets/logo.png";
import "./Home.css";

const SUPPORT_UNREAD_STORAGE_KEY = "supportUnreadByConversation";
const SUPPORT_LAST_SEEN_STORAGE_KEY = "supportLastSeenMessageByConversation";

function readStorageMap(key) {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorageMap(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value || {}));
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

function getLatestMessageId(conversation) {
  return (conversation?.messages || []).reduce((latestId, message) => {
    const messageId = Number(message?.id) || 0;
    return messageId > latestId ? messageId : latestId;
  }, 0);
}

function getTotalUnreadCount(unreadByConversation) {
  return Object.values(unreadByConversation || {}).reduce(
    (sum, count) => sum + (Number(count) || 0),
    0,
  );
}

function buildUnreadMapFromBootstrap(bootstrapData) {
  const conversations = [
    ...(bootstrapData?.supportConversations || []),
    ...(bootstrapData?.directConversations || []),
  ];
  const lastSeenByConversation = readStorageMap(SUPPORT_LAST_SEEN_STORAGE_KEY);
  const nextLastSeenByConversation = { ...lastSeenByConversation };
  const unreadByConversation = {};

  conversations.forEach((conversation) => {
    const conversationId = String(conversation.id);
    const hasLastSeen = Object.prototype.hasOwnProperty.call(nextLastSeenByConversation, conversationId);

    if (!hasLastSeen) {
      // First time we see this conversation on Home: set baseline and avoid counting old history as "new".
      nextLastSeenByConversation[conversationId] = getLatestMessageId(conversation);
      return;
    }

    const lastSeenMessageId = Number(nextLastSeenByConversation[conversationId]) || 0;
    const unreadCount = (conversation.messages || []).reduce((count, message) => {
      const messageId = Number(message?.id) || 0;
      if (!message.mine && messageId > lastSeenMessageId) {
        return count + 1;
      }
      return count;
    }, 0);

    if (unreadCount > 0) {
      unreadByConversation[conversationId] = unreadCount;
    }
  });

  writeStorageMap(SUPPORT_LAST_SEEN_STORAGE_KEY, nextLastSeenByConversation);
  writeStorageMap(SUPPORT_UNREAD_STORAGE_KEY, unreadByConversation);
  return unreadByConversation;
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [activeTaskCount, setActiveTaskCount] = useState(0);
  const [resourceCount, setResourceCount] = useState(0);
  const [supportUnreadTotal, setSupportUnreadTotal] = useState(() => getTotalUnreadCount(readStorageMap(SUPPORT_UNREAD_STORAGE_KEY)));
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/user/me", { withCredentials: true });
        setUser(res.data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate("/login");
        } else {
          setError(err.response?.data?.message || "Failed to load user info");
        }
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const fetchActiveTaskCount = async () => {
      try {
        const res = await api.get("/tasks/my", { withCredentials: true });
        const allTasks = Array.isArray(res.data) ? res.data : [];
        const activeTasks = allTasks.filter((task) => !(task.complete ?? task.isComplete));
        setActiveTaskCount(activeTasks.length);
      } catch (err) {
        console.error("Error fetching task count:", err);
        setActiveTaskCount(0);
      }
    };

    fetchActiveTaskCount();
  }, []);

  useEffect(() => {
    const fetchResourceCount = async () => {
      try {
        const videosResponse = await api.get("/api/videos/all", { withCredentials: true });
        const videos = Array.isArray(videosResponse.data) ? videosResponse.data : [];
        setResourceCount(videos.length);
      } catch (err) {
        console.error("Error fetching resource count:", err);
        setResourceCount(0);
      }
    };

    fetchResourceCount();
  }, []);

  useEffect(() => {
    const syncUnreadFromStorage = () => {
      const unreadByConversation = readStorageMap(SUPPORT_UNREAD_STORAGE_KEY);
      setSupportUnreadTotal(getTotalUnreadCount(unreadByConversation));
    };

    const onUnreadUpdated = () => {
      syncUnreadFromStorage();
    };

    const onStorageChanged = (event) => {
      if (event.key === SUPPORT_UNREAD_STORAGE_KEY) {
        syncUnreadFromStorage();
      }
    };

    syncUnreadFromStorage();
    window.addEventListener("support-unread-updated", onUnreadUpdated);
    window.addEventListener("storage", onStorageChanged);

    return () => {
      window.removeEventListener("support-unread-updated", onUnreadUpdated);
      window.removeEventListener("storage", onStorageChanged);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshSupportUnread = async () => {
      try {
        const response = await api.get("/support/bootstrap", { withCredentials: true });
        const unreadByConversation = buildUnreadMapFromBootstrap(response.data);

        if (!cancelled) {
          const total = getTotalUnreadCount(unreadByConversation);
          setSupportUnreadTotal(total);
          window.dispatchEvent(new CustomEvent("support-unread-updated", {
            detail: { total, unreadByConversation },
          }));
        }
      } catch (err) {
        if (err.response?.status !== 401 && err.response?.status !== 403) {
          console.error("Error refreshing support unread count:", err);
        }
      }
    };

    refreshSupportUnread();
    const intervalId = window.setInterval(refreshSupportUnread, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  if (error) return (
      <div className="modern-home-page flex items-center justify-center min-h-screen">
        <div className="premium-glass p-8 rounded-2xl text-red-800 font-medium">
          {error}
        </div>
      </div>
  );

  if (!user) return (
      <div className="modern-home-page flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#e8e4db] border-t-[#b49060] animate-spin"></div>
          <p className="text-[#827a71] font-medium tracking-wide">Initializing workspace...</p>
        </div>
      </div>
  );

  const navItems = [
    { label: "Profile", path: "/profile" },
    { label: "Resources", path: "/resources" },
    { label: "Support", path: "/SupportUser" },
    { label: "Review", path: "/Review" },
    { label: "Tasks", path: "/taskPage" },
  ];

  return (
      <div className="modern-home-page">
        {/* Background Orbs */}
        <div className="light-bg-gradient" />
        <div className="grain-overlay" />
        <div className="color-ribbon color-ribbon-1" />
        <div className="color-ribbon color-ribbon-2" />
        <div className="color-ribbon color-ribbon-3" />
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />
        <div className="glow-orb glow-orb-3" />

        {/* Main Content Area */}
        <main className="site-shell pt-6 pb-8 min-h-screen flex flex-col">

          {/* Top Floating Navigation */}
          <header
              className="premium-glass top-nav-shell rounded-full px-4 sm:px-6 py-3 sm:py-4 mb-6 sm:mb-10 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 animate-in"
              style={{ animationDelay: '100ms' }}
          >
            {/* Logo & Branding */}
            <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-lg shadow-[#b49060]/20 group-hover:shadow-[#b49060]/40 transition-all duration-300 transform group-hover:-translate-y-1">
                <img src={logo} alt="Uni Learn Hub logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-[#2d2926] leading-tight">
                  Uni Learn Hub
                </h1>
                <p className="text-xs font-semibold text-[#b49060] uppercase tracking-widest">
                  Knowledge Stream
                </p>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="flex flex-wrap items-center justify-center gap-2 lg:gap-3">
              {navItems.map((item, index) => (
                  <button
                      key={item.label}
                      className="nav-pill text-xs sm:text-sm"
                      onClick={() => navigate(item.path)}
                      style={{ animationDelay: `${200 + index * 100}ms` }}
                  >
                    <span>{item.label}</span>
                    {item.path === "/SupportUser" && supportUnreadTotal > 0 && (
                      <span className="ml-2 inline-flex min-w-6 h-6 items-center justify-center rounded-full border border-[#c9a46b] bg-[#f6e7cf] px-2 text-[11px] font-extrabold text-[#6d4a2b] shadow-sm">
                        {supportUnreadTotal > 99 ? "99+" : supportUnreadTotal}
                      </span>
                    )}
                  </button>
              ))}
            </nav>
          </header>

          {/* Welcome & Stats Grid Section */}
          <section
              className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in"
              style={{ animationDelay: '300ms' }}
          >
            {/* Main Welcome Card */}
            <div className="lg:col-span-2 premium-glass welcome-surface rounded-3xl p-6 lg:p-8 relative overflow-hidden flex flex-col justify-center">
              <span className="welcome-accent-dot welcome-accent-dot-1" />
              <span className="welcome-accent-dot welcome-accent-dot-2" />
              <span className="welcome-accent-dot welcome-accent-dot-4" />
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-[#b49060]/5 to-transparent pointer-events-none"></div>

              {/* Minimalist Watermark on the Right Corner to fix empty space */}
              <div className="absolute top-0 right-0 h-full w-1/2 overflow-hidden pointer-events-none opacity-50">
                <svg className="absolute -right-8 -bottom-16 w-80 h-80 text-[#b49060]/10" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" d="M47.7,-64.5C61.3,-53.1,71.5,-37.2,76.5,-19.9C81.4,-2.5,81.1,16.2,73.5,31.7C65.9,47.1,51.1,59.3,34.4,66.5C17.7,73.8,-0.9,76.1,-19.1,72.6C-37.3,69,-55.1,59.6,-66.9,44.5C-78.7,29.3,-84.5,8.4,-81.4,-11C-78.3,-30.4,-66.2,-48.3,-50.7,-59.4C-35.1,-70.5,-17.6,-74.8,0.5,-75.4C18.6,-76,34.1,-76,47.7,-64.5Z" transform="translate(100 100) scale(1.1)" />
                </svg>
                <svg className="absolute -right-4 -top-10 w-64 h-64 text-[#876d47]/5" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <path fill="currentColor" d="M51.9,-69.1C64.3,-58.5,69.5,-39,71.7,-20.5C73.9,-2.1,73.1,15.4,65.4,30.3C57.7,45.2,43,57.5,26.4,65.1C9.8,72.7,-8.7,75.4,-25.6,71.1C-42.5,66.8,-57.8,55.4,-67.2,40.5C-76.6,25.6,-80.1,7.2,-75.6,-9.3C-71.2,-25.8,-58.8,-40.4,-44.6,-50.8C-30.5,-61.1,-15.2,-67.3,1.6,-69.5C18.4,-71.6,39.5,-79.8,51.9,-69.1Z" transform="translate(100 100) scale(1)" />
                </svg>
                <div className="absolute inset-0 bg-[radial-gradient(#b49060_2px,transparent_2px)] [background-size:16px_16px] opacity-[0.05]"></div>
              </div>

              <div className="relative z-10 w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-[#e8e4db] text-[#876d47] text-[11px] font-bold tracking-[0.15em] uppercase mb-4 shadow-sm w-fit">
                  <span className="w-2 h-2 rounded-full bg-[#b49060] animate-pulse"></span>
                  Dashboard Overview
                </div>
                <h2 className="text-2xl md:text-4xl lg:text-3xl font-extrabold mb-3 tracking-tight text-[#2d2926]">
                  Welcome back, <span className="text-gradient drop-shadow-sm">{user.firstname || user.name}</span>
                </h2>
                <p className="text-[#5c544d] text-base lg:text-lg font-medium max-w-xl leading-relaxed mb-6">
                  Your knowledge stream is ready. Discover new resources, track academic tasks, and connect with peers instantly.
                </p>

                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4">
                  <button
                      onClick={() => navigate('/taskPage')}
                      className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-[0_4px_10px_rgba(180,144,96,0.3)] hover:shadow-[0_6px_15px_rgba(180,144,96,0.4)] hover:-translate-y-0.5 transition-all outline-none"
                  >
                    View Tasks
                  </button>
                  <button
                      onClick={() => navigate('/resources')}
                      className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-[#876d47] border border-[#e8e4db] font-bold text-sm shadow-sm hover:bg-[#faf5eb] transition-all outline-none"
                  >
                    Browse Resources
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side Stats Grid */}
            <div className="lg:col-span-1 grid grid-cols-1 gap-4">

              {/* Stat Card 1: Active Tasks */}
              <div className="premium-glass stat-card-pop rounded-3xl p-4 sm:p-6 relative overflow-hidden flex items-center justify-between group hover:-translate-y-1 transition-transform cursor-pointer" data-tone="amber" onClick={() => navigate('/taskPage')}>
                <div className="absolute -right-4 -top-4 w-20 h-20 sm:w-24 sm:h-24 bg-[#b49060]/10 rounded-full blur-xl group-hover:bg-[#b49060]/20 transition-colors"></div>
                <div>
                  <p className="text-[#827a71] text-xs font-bold uppercase tracking-widest mb-1">Active Tasks</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2d2926]">{activeTaskCount}</h3>
                  <p className="text-[#b49060] text-xs sm:text-sm font-semibold mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    <span>On track</span>
                  </p>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-[#e8e4db] shadow-sm flex items-center justify-center text-[#b49060]">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                </div>
              </div>

              {/* Stat Card 2: Saved Resources */}
              <div className="premium-glass stat-card-pop rounded-3xl p-4 sm:p-6 relative overflow-hidden flex items-center justify-between group hover:-translate-y-1 transition-transform cursor-pointer" data-tone="sage" onClick={() => navigate('/resources')}>
                <div className="absolute -right-4 -top-4 w-20 h-20 sm:w-24 sm:h-24 bg-[#876d47]/10 rounded-full blur-xl group-hover:bg-[#876d47]/20 transition-colors"></div>
                <div>
                  <p className="text-[#827a71] text-xs font-bold uppercase tracking-widest mb-1">Assigned Resources</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2d2926]">{resourceCount}</h3>
                  <p className="text-[#876d47] text-xs sm:text-sm font-semibold mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                    <span>Assigned to you</span>
                  </p>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#faf5eb] border border-[#e8e4db] shadow-sm flex items-center justify-center text-[#876d47]">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
              </div>

            </div>
          </section>

          {/* Dashboard Grid – Fixed Height Issue */}
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-[350px_minmax(0,1fr)] gap-6 h-full min-h-0">

            {/* Left Sidebar – will stretch to match right column */}
            <aside className="flex flex-col h-full min-h-0 gap-8">
              {/* User Profile Card */}
              <div
                  className="premium-glass rounded-3xl p-4 sm:p-6 animate-in flex-shrink-0"
                  style={{ animationDelay: '400ms' }}
              >
                <div className="flex items-center gap-3 sm:gap-5 mb-4 sm:mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-1 bg-gradient-to-tr from-[#b49060] to-[#876d47] flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-lg sm:text-xl font-bold text-[#2d2926] uppercase shadow-sm">
                      {(user.firstname || user.name || "U")[0]}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#827a71] uppercase tracking-widest mb-1">Signed In As</p>
                    <h3 className="text-lg sm:text-xl font-bold text-[#2d2926]">{user.firstname || user.name}</h3>
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#fcfbf9] text-[#b49060] text-xs font-bold border border-[#e8e4db] mt-2">
                      {user.role}
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-[#e8e4db]">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#5c544d] font-medium">Account Status</span>
                    <span className="flex items-center gap-2 text-[#64715e] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#708069] animate-pulse"></span> Active
                  </span>
                  </div>
                </div>
              </div>

              {/* Ongoing Tasks – fills remaining space, scrolls if needed */}
              <div
                  className="premium-glass rounded-3xl p-6 flex-1 flex flex-col overflow-hidden animate-in"
                  style={{ animationDelay: '500ms' }}
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
                  <h3 className="text-lg sm:text-xl font-bold text-[#2d2926] flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#b49060]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Tasks Focus
                  </h3>
                </div>
                <div className="tasks-container flex-1 min-h-0 overflow-y-auto">
                  {/* OngoingTasks component – ensure it fills container and scrolls if needed */}
                  <OngoingTasks />
                </div>
              </div>
            </aside>

            {/* Right Main Content (Feed) – full height with scroll */}
            <section
                className="post-feed-container flex flex-col h-full min-h-0 animate-in"
                style={{ animationDelay: '600ms' }}
            >
              {/* Custom header for the feed panel */}
              <div className="feed-topbar-spark px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-[#fcfbf9]/96 via-[#fff8eb]/96 to-[#f5ebda]/96 backdrop-blur-md border-b border-[#e8e4db] flex items-center justify-start w-full flex-shrink-0">
                <h3 className="text-base sm:text-lg font-bold text-[#2d2926] flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#b49060]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14" />
                  </svg>
                  Community Stream
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                <PostFeed/>
              </div>
            </section>

          </div>
        </main>
      </div>
  );
}
