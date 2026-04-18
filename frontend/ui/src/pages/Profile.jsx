import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import logo from "../assets/logo.png";
import MyPostFeed from "../post/MyPostFeed .jsx";
import "./Home.css";

const interestMap = {
  BACKEND: { label: "Backend Development", color: "#b49060" },
  FRONTEND: { label: "Frontend Development", color: "#876d47" },
  FULLSTACK: { label: "Full Stack", color: "#5c544d" },
  DATA_SCIENCE: { label: "Data Science", color: "#6f917e" },
  CLOUD: { label: "Cloud & DevOps", color: "#9c8472" },
  UI_UX: { label: "UI/UX Design", color: "#d6b58b" },
};

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [coverImageFailed, setCoverImageFailed] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let res;
        try {
          res = await api.get("/user/me", { withCredentials: true });
        } catch (err) {
          if (err.response?.status === 403) {
            res = await api.get("/admin/me", { withCredentials: true });
          } else {
            throw err;
          }
        }
        setProfile(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login", { state: { message: "Please login first" } });
        } else {
          setError(err.response?.data?.message || "Failed to load profile");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    setProfileImageFailed(false);
  }, [profile?.profileImageUrl, profile?.imageUrl]);

  useEffect(() => {
    setCoverImageFailed(false);
  }, [profile?.coverImageUrl]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch {
      // Ignore logout API failures and continue with client-side sign out.
    } finally {
      localStorage.clear();
      navigate("/login");
    }
  };

  if (loading) return (
      <div className="modern-home-page flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#e8e4db] border-t-[#b49060] animate-spin"></div>
          <p className="text-[#827a71] font-medium tracking-wide">Loading Profile...</p>
        </div>
      </div>
  );

  if (error) return (
      <div className="modern-home-page flex items-center justify-center min-h-screen">
        <div className="premium-glass p-8 rounded-2xl text-red-800 font-medium">
          {error}
        </div>
      </div>
  );

  const firstName = profile?.firstname || profile?.firstName || "";
  const lastName = profile?.lastName || "";
  const email = profile?.email || "";
  const phoneNumber = profile?.phoneNumber || "";
  const interest = profile?.interest ? interestMap[profile.interest] : null;
  const tempEmail = profile?.tempEmail || "";
  const profileImageUrl = profile?.profileImageUrl || profile?.imageUrl || "";
  const coverImageUrl = profile?.coverImageUrl || "";
  const isAdmin = (profile?.role || "").toUpperCase().includes("ADMIN");

  const backendBaseUrl = api.defaults.baseURL || "";
  const profileImageFullUrl = profileImageUrl ? backendBaseUrl + profileImageUrl : null;
  const coverImageFullUrl = coverImageUrl ? backendBaseUrl + coverImageUrl : null;
  const showProfileImage = Boolean(profileImageFullUrl) && !profileImageFailed;
  const showCoverImage = Boolean(coverImageFullUrl) && !coverImageFailed;
  const navItems = isAdmin
      ? [
        { label: "Profile", path: "/profile" },
        { label: "Support", path: "/SupportAdmin" },
        { label: "Resources", path: "/resources-management" },
        { label: "Admin Tasks", path: "/admin-task-manager" },
      ]
      : [
        { label: "Profile", path: "/profile" },
        { label: "Resources", path: "/resources" },
        { label: "Support", path: "/SupportUser" },
        { label: "Review", path: "/Review" },
        { label: "Tasks", path: "/taskPage" },
      ];

  return (
      <div className="modern-home-page">
        {/* Background Effects */}
        <div className="light-bg-gradient" />
        <div className="grain-overlay" />
        <div className="color-ribbon color-ribbon-1" />
        <div className="color-ribbon color-ribbon-2" />
        <div className="color-ribbon color-ribbon-3" />
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />
        <div className="glow-orb glow-orb-3" />

        <main className="site-shell pt-6 pb-16 min-h-screen flex flex-col gap-8">
          <header
              className="premium-glass top-nav-shell rounded-full px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 animate-in"
              style={{ animationDelay: "100ms" }}
          >
            <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer" onClick={() => navigate(isAdmin ? "/dashboard" : "/home")}>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-lg shadow-[#5f3920]/20 transition-all duration-300">
                <img src={logo} alt="Uni Learn Hub logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight">
                  {isAdmin ? "Uni Learn Hub Admin" : "Uni Learn Hub"}
                </h1>
                <p className="text-xs font-semibold uppercase tracking-widest">
                  {isAdmin ? "Profile Control Center" : "Profile Space"}
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-2 lg:gap-3">
              {navItems.map((item) => (
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

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in" style={{ animationDelay: "200ms" }}>
            {/* Left Sidebar: Profile Card */}
            <div className="lg:col-span-4 lg:col-start-1 flex flex-col gap-6">
              <div className="premium-glass rounded-3xl overflow-hidden flex flex-col sticky top-6 shadow-md border border-white/40">
                {/* Cover Area */}
                <div className="relative h-32 sm:h-40 bg-gradient-to-br from-[#e8e4db] to-[#fcfbf9]">
                  {showCoverImage ? (
                      <img
                          src={coverImageFullUrl}
                          alt=""
                          className="w-full h-full object-cover opacity-90"
                          onError={() => setCoverImageFailed(true)}
                      />
                  ) : (
                      <>
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(252,251,249,0.98)_0%,rgba(235,227,216,0.96)_52%,rgba(214,194,166,0.94)_100%)]" />
                        <div className="absolute -left-8 top-5 h-24 w-24 rounded-full bg-white/32 blur-2xl" />
                        <div className="absolute right-4 top-4 h-28 w-28 rounded-full bg-[#b49060]/16 blur-3xl" />
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/55 to-transparent" />
                      </>
                  )}

                  {/* Avatar */}
                  <div className="absolute -bottom-12 left-6 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white overflow-hidden bg-gradient-to-tr from-[#b49060] to-[#876d47] flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                    {showProfileImage ? (
                        <img
                            src={profileImageFullUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={() => setProfileImageFailed(true)}
                        />
                    ) : (
                        <div className="relative h-full w-full overflow-hidden rounded-full bg-[radial-gradient(circle_at_30%_30%,#d8bc95_0%,#b49060_50%,#876d47_100%)]">
                          <div className="absolute left-[32%] top-[23%] h-[24%] w-[24%] rounded-full bg-white/22" />
                          <div className="absolute bottom-[18%] left-[20%] right-[20%] h-[34%] rounded-[999px_999px_42%_42%] bg-white/16" />
                          <div className="absolute inset-[13%] rounded-full border border-white/14" />
                        </div>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="pt-16 pb-8 px-6">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2d2926] mb-1">{firstName} {lastName}</h2>
                  {profile?.role && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#faf5eb] text-[#b49060] text-[11px] font-bold border border-[#e8e4db] mb-4 shadow-sm uppercase tracking-wider">
                  {profile.role.replace("ROLE_", "")}
                </span>
                  )}

                  {/* Details List */}
                  <div className="flex flex-col gap-3 mb-8 mt-2">
                    <div className="bg-white/60 p-3.5 rounded-2xl border border-[#e8e4db] shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#fcfbf9] border border-[#e8e4db] flex items-center justify-center text-[#b49060] shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold text-[#827a71] uppercase tracking-wider mb-0.5">Email Details</div>
                        <div className="text-[#2d2926] text-sm font-semibold truncate" title={email}>{email}</div>
                      </div>
                    </div>

                    {phoneNumber && (
                        <div className="bg-white/60 p-3.5 rounded-2xl border border-[#e8e4db] shadow-sm flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#fcfbf9] border border-[#e8e4db] flex items-center justify-center text-[#b49060] shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold text-[#827a71] uppercase tracking-wider mb-0.5">Phone Number</div>
                            <div className="text-[#2d2926] text-sm font-semibold truncate">{phoneNumber}</div>
                          </div>
                        </div>
                    )}

                    {(interest || profile?.interest) && (
                        <div className="bg-white/60 p-3.5 rounded-2xl border border-[#e8e4db] shadow-sm flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#fcfbf9] border border-[#e8e4db] flex items-center justify-center text-[#b49060] shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold text-[#827a71] uppercase tracking-wider mb-0.5">Primary Interest</div>
                            <div className="text-sm font-bold truncate" style={{ color: interest?.color || "#b49060" }}>{interest?.label || profile?.interest}</div>
                          </div>
                        </div>
                    )}

                    {tempEmail && (
                        <div className="bg-white/60 p-3.5 rounded-2xl border border-[#e8e4db] shadow-sm flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#fcfbf9] border border-[#e8e4db] flex items-center justify-center text-[#b49060] shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold text-[#827a71] uppercase tracking-wider mb-0.5">Alternate Email</div>
                            <div className="text-[#2d2926] text-sm font-semibold truncate" title={tempEmail}>{tempEmail}</div>
                          </div>
                        </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    <button
                        onClick={() => navigate("/settings")}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-md hover:-translate-y-0.5 transition-transform"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      Edit Profile
                    </button>
                    <div className="flex gap-3">
                      <button
                          onClick={() => navigate(isAdmin ? "/dashboard" : "/home")}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:bg-[#faf5eb] hover:text-[#b49060] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        {isAdmin ? "Dashboard" : "Home"}
                      </button>
                      <button
                          onClick={handleLogout}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#fcf1ef] text-[#c36254] border border-[#f0c3be] font-bold text-sm shadow-sm hover:bg-[#c36254] hover:text-white transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Main Content: Post Feed */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="premium-glass rounded-3xl p-6 sm:p-8 shadow-md border border-white/40 h-full">
                <MyPostFeed/>
              </div>
            </div>
          </section>
        </main>
      </div>
  );
}
