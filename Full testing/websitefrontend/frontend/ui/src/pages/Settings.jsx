import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import logo from "../assets/logo.png";
import { toast } from "react-toastify";
import "./Home.css";

export default function SettingsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    profileImageUrl: "",
    coverImageUrl: "",
  });

  const [nameForm, setNameForm] = useState({ name: "", lastName: "" });
  const [emailForm, setEmailForm] = useState({ newEmail: "", otp: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [deleteForm, setDeleteForm] = useState({ currentPassword: "" });

  const [profileFile, setProfileFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const [profilePreview, setProfilePreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [coverImageFailed, setCoverImageFailed] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
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
        const data = res.data;

        setUser({
          firstName: data.firstName || data.firstname || data.name || "",
          lastName: data.lastName || data.lastname || "",
          email: data.email || "",
          role: data.role || "",
          profileImageUrl: data.profileImageUrl || data.imageUrl || "",
          coverImageUrl: data.coverImageUrl || "",
        });

        setNameForm({
          name: data.firstName || data.firstname || data.name || "",
          lastName: data.lastName || data.lastname || "",
        });

        const base = api.defaults.baseURL || "";
        const toAbsolute = (url) =>
          url ? (url.startsWith("http") ? url : base + url) : null;

        setProfilePreview(toAbsolute(data.profileImageUrl || data.imageUrl));
        setCoverPreview(toAbsolute(data.coverImageUrl));
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    setProfileImageFailed(false);
  }, [profilePreview]);

  useEffect(() => {
    setCoverImageFailed(false);
  }, [coverPreview]);

  const handleProfileFile = (e) => {
    const file = e.target.files[0];
    setProfileFile(file);
    setProfileImageFailed(false);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCoverFile = (e) => {
    const file = e.target.files[0];
    setCoverFile(file);
    setCoverImageFailed(false);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const validateName = () => {
    if (!nameForm.name.trim()) { toast.error("First name is required"); return false; }
    if (!nameForm.lastName.trim()) { toast.error("Last name is required"); return false; }
    return true;
  };

  const validateEmail = () => {
    if (!emailForm.newEmail) { toast.error("Email is required"); return false; }
    if (!/\S+@\S+\.\S+/.test(emailForm.newEmail))
      { toast.error("Invalid email format"); return false; }
    return true;
  };

  const validatePassword = () => {
    if (!passwordForm.currentPassword)
      { toast.error("Current password required"); return false; }
    if (passwordForm.newPassword.length < 6)
      { toast.error("Password must be at least 6 characters"); return false; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      { toast.error("Passwords do not match"); return false; }
    return true;
  };

  const validateDelete = () => {
    if (!deleteForm.currentPassword)
      { toast.error("Enter password to delete account"); return false; }
    return true;
  };

  const handleResponse = (res, redirectLogin = false) => {
    toast.success(res.data?.message || "Success");
    if (redirectLogin) setTimeout(() => navigate("/login"), 1500);
  };

  const handleError = (err) => {
    toast.error(err.response?.data?.message || "Something went wrong");
  };

  const updateName = async () => {
    if (!validateName()) return;
    setLoading(true);
    try {
      const res = await api.put("/user/update-name", nameForm, {
        withCredentials: true,
      });
      handleResponse(res);
      setUser({ ...user, firstName: nameForm.name, lastName: nameForm.lastName });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const requestEmailUpdate = async () => {
    if (!validateEmail()) return;
    setLoading(true);
    try {
      const res = await api.put(
        "/user/update-email",
        { newEmail: emailForm.newEmail },
        { withCredentials: true }
      );
      handleResponse(res);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const verifyNewEmail = async () => {
    if (!emailForm.otp) return toast.error("OTP required");
    setLoading(true);
    try {
      const res = await api.post("/user/verify-new-email", null, {
        params: { otp: emailForm.otp },
        withCredentials: true,
      });
      handleResponse(res, true);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!validatePassword()) return;
    setLoading(true);
    try {
      const res = await api.put("/user/update-password", passwordForm, {
        withCredentials: true,
      });
      handleResponse(res, true);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!validateDelete()) return;
    setLoading(true);
    try {
      const res = await api.delete("/user/delete", {
        data: deleteForm,
        withCredentials: true,
      });
      handleResponse(res, true);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileFile) return toast.error("Select a profile image");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", profileFile);
    try {
      const res = await api.post("/user/upload-profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      toast.success("Profile image uploaded!");
      const newUrl = res.data.imageUrl || res.data;
      setUser({ ...user, profileImageUrl: newUrl });
      const base = api.defaults.baseURL || "";
      const toAbsolute = (url) => (url ? (url.startsWith("http") ? url : base + url) : null);
      setProfilePreview(toAbsolute(newUrl));
      setProfileFile(null);
    } catch (err) {
      handleError(err);
    } finally {
      setUploading(false);
    }
  };

  const uploadCoverImage = async () => {
    if (!coverFile) return toast.error("Select a cover image");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", coverFile);
    try {
      const res = await api.post("/user/upload-cover-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      toast.success("Cover image uploaded!");
      const newUrl = res.data.imageUrl || res.data;
      setUser({ ...user, coverImageUrl: newUrl });
      const base = api.defaults.baseURL || "";
      const toAbsolute = (url) => (url ? (url.startsWith("http") ? url : base + url) : null);
      setCoverPreview(toAbsolute(newUrl));
      setCoverFile(null);
    } catch (err) {
      handleError(err);
    } finally {
      setUploading(false);
    }
  };

  if (initialLoading) return (
    <div className="modern-home-page flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#e8e4db] border-t-[#b49060] animate-spin"></div>
        <p className="text-[#827a71] font-medium tracking-wide">Loading settings...</p>
      </div>
    </div>
  );

  const isAdmin = (user.role || "").toUpperCase().includes("ADMIN");
  const showProfilePreview = Boolean(profilePreview) && !profileImageFailed;
  const showCoverPreview = Boolean(coverPreview) && !coverImageFailed;
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
      <div className="light-bg-gradient" />
      <div className="grain-overlay" />
      <div className="color-ribbon color-ribbon-1" />
      <div className="color-ribbon color-ribbon-2" />
      <div className="color-ribbon color-ribbon-3" />
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <div className="glow-orb glow-orb-3" />

      <main className="site-shell pt-6 pb-16 min-h-screen flex flex-col gap-6 animate-in" style={{ animationDelay: '100ms' }}>
        <header
          className="premium-glass top-nav-shell rounded-full px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6"
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
                {isAdmin ? "Settings Control Center" : "Account Settings"}
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

        <div className="flex justify-between items-center mb-2">
           <h2 className="text-3xl font-extrabold text-[#2d2926] flex items-center gap-3">
            <svg className="w-8 h-8 text-[#b49060]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Account Settings
          </h2>
          <button 
            onClick={() => navigate("/profile")}
            className="px-5 py-2.5 rounded-full bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:text-[#b49060] transition-colors flex items-center gap-2"
          >
            ← Back to Profile
          </button>
        </div>

        {/* Media Section */}
        <div className="premium-glass rounded-3xl overflow-hidden shadow-md flex flex-col relative mb-4">
          <div className="h-48 md:h-64 w-full bg-gradient-to-r from-[#e8e4db] to-[#d4cebd] relative">
            {showCoverPreview ? (
              <img
                src={coverPreview}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setCoverImageFailed(true)}
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(252,251,249,0.98)_0%,rgba(235,227,216,0.96)_52%,rgba(214,194,166,0.94)_100%)]" />
                <div className="absolute -left-8 top-8 h-28 w-28 rounded-full bg-white/32 blur-2xl" />
                <div className="absolute right-5 top-6 h-32 w-32 rounded-full bg-[#b49060]/16 blur-3xl" />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/55 to-transparent" />
              </>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <input type="file" accept="image/*" id="coverInput" onChange={handleCoverFile} className="hidden" />
              <button 
                onClick={() => document.getElementById("coverInput").click()}
                className="px-4 py-2 bg-black/40 backdrop-blur-md text-white rounded-full text-xs font-bold hover:bg-black/60 transition-colors"
              >
                 Change Cover
              </button>
              {coverFile && (
                <button 
                  onClick={uploadCoverImage} disabled={uploading}
                  className="px-4 py-2 bg-[#b49060] text-white rounded-full text-xs font-bold shadow-md hover:bg-[#876d47] transition-colors disabled:opacity-50"
                >
                   {uploading ? "Uploading..." : "Save Cover"}
                </button>
              )}
            </div>
            
            {/* Gradient overlay for bottom edge */}
            <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>
          
          <div className="px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 sm:-mt-20">
              <div className="relative inline-block z-10 w-32 h-32 sm:w-40 sm:h-40">
                <div className="w-full h-full rounded-2xl border-4 border-white overflow-hidden bg-white shadow-xl flex-shrink-0">
                  {showProfilePreview ? (
                    <img
                      src={profilePreview}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => setProfileImageFailed(true)}
                    />
                  ) : (
                    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_30%_30%,#d8bc95_0%,#b49060_50%,#876d47_100%)]">
                      <div className="absolute left-[32%] top-[23%] h-[24%] w-[24%] rounded-full bg-white/22" />
                      <div className="absolute bottom-[18%] left-[20%] right-[20%] h-[34%] rounded-[999px_999px_42%_42%] bg-white/16" />
                      <div className="absolute inset-[13%] rounded-[20px] border border-white/14" />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-[-10px] right-2 sm:-right-4 flex flex-col gap-2">
                  <input type="file" accept="image/*" id="profileInput" onChange={handleProfileFile} className="hidden" />
                  <button 
                    onClick={() => document.getElementById("profileInput").click()}
                    className="w-10 h-10 rounded-full bg-white shadow-md border border-[#e8e4db] flex items-center justify-center text-[#5c544d] hover:text-[#b49060] hover:bg-[#faf5eb] transition-colors z-20 group"
                    title="Change Photo"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                  {profileFile && (
                    <button 
                      onClick={uploadProfileImage} disabled={uploading}
                      className="px-3 py-1.5 absolute top-12 -right-8 bg-[#b49060] text-white rounded-lg text-xs font-bold shadow-md whitespace-nowrap disabled:opacity-50"
                    >
                      {uploading ? "Saving..." : "Save Photo!"}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 mt-4 md:mt-0 md:pb-2">
                <h1 className="text-3xl font-extrabold text-[#2d2926] drop-shadow-sm">{user.firstName} {user.lastName}</h1>
                <p className="text-[#876d47] font-medium tracking-wide drop-shadow-sm">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Update Name */}
          <div className="premium-glass rounded-3xl p-6 sm:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#b49060]/10 to-transparent rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#e8e4db] flex items-center justify-center text-[#b49060] shadow-sm">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-[#2d2926]">Update Name</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#827a71] uppercase tracking-wider mb-2">First Name</label>
                <input
                  placeholder="First Name"
                  value={nameForm.name}
                  onChange={(e) => setNameForm({ ...nameForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#827a71] uppercase tracking-wider mb-2">Last Name</label>
                <input
                  placeholder="Last Name"
                  value={nameForm.lastName}
                  onChange={(e) => setNameForm({ ...nameForm, lastName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm transition-all"
                />
              </div>
              <button 
                onClick={updateName} disabled={loading}
                className="mt-2 w-full px-4 py-3 rounded-xl bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:bg-[#faf5eb] hover:text-[#b49060] transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Update Email */}
          <div className="premium-glass rounded-3xl p-6 sm:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#b49060]/10 to-transparent rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#e8e4db] flex items-center justify-center text-[#b49060] shadow-sm">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-[#2d2926]">Update Email</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#827a71] uppercase tracking-wider mb-2">New Email Address</label>
                <div className="flex gap-2">
                  <input
                    placeholder="New Email"
                    value={emailForm.newEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm transition-all"
                  />
                  <button 
                    onClick={requestEmailUpdate} disabled={loading}
                    className="px-4 py-3 rounded-xl bg-[#f1efe9] text-[#5c544d] font-bold text-sm border border-[#e8e4db] whitespace-nowrap hover:bg-[#e8e4db] transition-colors disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[#827a71] uppercase tracking-wider mb-2 mt-2">Verification Code</label>
                 <div className="flex gap-2">
                  <input
                    placeholder="OTP Code"
                    value={emailForm.otp}
                    onChange={(e) => setEmailForm({ ...emailForm, otp: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm transition-all"
                  />
                  <button 
                    onClick={verifyNewEmail} disabled={loading}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-md whitespace-nowrap hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify & Update"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="premium-glass rounded-3xl p-6 sm:p-8 relative overflow-hidden md:col-span-2 lg:col-span-1">
             <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#b49060]/10 to-transparent rounded-bl-full pointer-events-none"></div>
             <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#e8e4db] flex items-center justify-center text-[#b49060] shadow-sm">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-[#2d2926]">Change Password</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type={showPassword.current ? "text" : "password"}
                  placeholder="Current Password"
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm transition-all"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-xs font-bold text-[#827a71] hover:text-[#b49060]"
                  onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                >
                  {showPassword.current ? "Hide" : "Show"}
                </button>
              </div>
              
              <div className="relative">
                <input
                   type={showPassword.new ? "text" : "password"}
                  placeholder="New Password (min. 6 chars)"
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm transition-all"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-xs font-bold text-[#827a71] hover:text-[#b49060]"
                  onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                >
                  {showPassword.new ? "Hide" : "Show"}
                </button>
              </div>
              
              <div className="relative mb-2">
                <input
                   type={showPassword.confirm ? "text" : "password"}
                  placeholder="Confirm New Password"
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm transition-all"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-xs font-bold text-[#827a71] hover:text-[#b49060]"
                  onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                >
                  {showPassword.confirm ? "Hide" : "Show"}
                </button>
              </div>
              
              <button 
                onClick={updatePassword} disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#2d2926] to-[#4a443c] text-white font-bold text-sm shadow-md hover:-translate-y-0.5 transition-transform disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>

          {/* Delete Account */}
          <div className="premium-glass rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-white/40 border-[#f0c3be]/40 md:col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#c36254]/10 to-transparent rounded-bl-full pointer-events-none"></div>
             <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#fcf1ef] border border-[#f0c3be] flex items-center justify-center text-[#c36254] shadow-sm">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-[#c36254]">Danger Zone</h3>
            </div>
            
            <p className="text-sm font-medium text-[#c36254]/80 mb-6 bg-[#fcf1ef]/50 p-3 rounded-xl border border-[#f0c3be]/50">
              ⚠️ This action is irreversible. All your data, tasks, and settings will be permanently removed.
            </p>
            
            <div className="flex flex-col gap-4">
              <input
                type="password"
                placeholder="Confirm password to delete"
                onChange={(e) => setDeleteForm({ currentPassword: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#f0c3be] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#c36254]/30 shadow-sm transition-all"
              />
              <button 
                onClick={deleteAccount} disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-[#fcf1ef] text-[#c36254] border border-[#f0c3be] font-bold text-sm shadow-sm hover:bg-[#c36254] hover:text-white transition-colors disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Permanently Delete Account"}
              </button>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
