
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import MyPostFeed from "../post/MyPostFeed ";
import "./Profile.css";


const interestMap = {
  BACKEND: { label: "Backend Development", color: "#0077b6" },
  FRONTEND: { label: "Frontend Development", color: "#00a8e8" },
  FULLSTACK: { label: "Full Stack", color: "#6c757d" },
  DATA_SCIENCE: { label: "Data Science", color: "#28a745" },
  CLOUD: { label: "Cloud & DevOps", color: "#ffc107" },
  UI_UX: { label: "UI/UX Design", color: "#dc3545" },
};

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/user/me", { withCredentials: true });
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

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      localStorage.clear();
      navigate("/login", { state: { message: "Logged out successfully" } });
    }
  };

  if (loading) return <div className="profile-status">Loading profile...</div>;
  if (error) return <div className="profile-status profile-status--error">{error}</div>;


  const firstName = profile?.firstname || profile?.firstName || "";
  const lastName = profile?.lastName || "";
  const email = profile?.email || "";
  const phoneNumber = profile?.phoneNumber || "";
  const interest = profile?.interest ? interestMap[profile.interest] : null;
  const tempEmail = profile?.tempEmail || "";
  const profileImageUrl = profile?.profileImageUrl || profile?.imageUrl || "";
  const coverImageUrl = profile?.coverImageUrl || "";

  const avatarFallback = firstName ? firstName.charAt(0).toUpperCase() : "U";


  const backendBaseUrl = api.defaults.baseURL || "";
  const buildImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${backendBaseUrl}${path}`;
  };

  const profileImageFullUrl = buildImageUrl(profileImageUrl);
  const coverImageFullUrl = buildImageUrl(coverImageUrl);
  const roleText = profile?.role?.replace("ROLE_", "") || "USER";

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-cover">
        {coverImageFullUrl && (
          <img src={coverImageFullUrl} alt="Cover" className="profile-cover-image" />
        )}
        </div>

        <div className="profile-avatar">
          {profileImageFullUrl ? (
            <img src={profileImageFullUrl} alt="Avatar" className="profile-avatar-image" />
          ) : avatarFallback}
        </div>
      </section>

      <section className="profile-card">
        <div className="profile-identity">
          <h1>{firstName} {lastName}</h1>
          <span className="profile-role">{roleText}</span>
        </div>

        <div className="profile-info-grid">
          <div className="profile-info-card profile-info-card--blue">
            <div className="profile-info-title">Email</div>
            <div className="profile-info-value">{email || "Not set"}</div>
          </div>

          <div className="profile-info-card profile-info-card--green">
            <div className="profile-info-title">Phone</div>
            <div className="profile-info-value">{phoneNumber || "Not set"}</div>
          </div>

          <div className="profile-info-card" style={{ borderColor: interest?.color || "#94a3b8" }}>
            <div className="profile-info-title">Primary Interest</div>
            <div className="profile-info-value">{interest?.label || profile?.interest || "Not set"}</div>
          </div>

          {tempEmail && (
            <div className="profile-info-card profile-info-card--violet">
              <div className="profile-info-title">Alternate Email</div>
              <div className="profile-info-value">{tempEmail}</div>
            </div>
          )}
        </div>

        <div className="profile-actions">
          <button
            onClick={() => navigate("/settings")}
            className="profile-btn profile-btn--primary"
          >
            Edit Profile
          </button>

          <button
            onClick={handleLogout}
            className="profile-btn profile-btn--danger"
          >
            Logout
          </button>
        </div>
      </section>

      <section className="profile-posts-panel">
        <MyPostFeed />
      </section>

    </div>
  );
}