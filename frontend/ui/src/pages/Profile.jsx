import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";


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

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>;
  if (error) return <div style={{ padding: "20px", color: "red" }}>{error}</div>;

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
  const profileImageFullUrl = profileImageUrl ? backendBaseUrl + profileImageUrl : null;
  const coverImageFullUrl = coverImageUrl ? backendBaseUrl + coverImageUrl : null;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <div style={{ position: "relative", height: "200px", backgroundColor: "#ddd", marginBottom: "70px" }}>
        {coverImageFullUrl && (
          <img src={coverImageFullUrl} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}

        <div style={{
          position: "absolute",
          bottom: "-50px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          border: "3px solid white",
          overflow: "hidden",
          backgroundColor: "#2196f3",
          textAlign: "center",
          lineHeight: "100px",
          fontSize: "36px",
          color: "white",
        }}>
          {profileImageFullUrl ? (
            <img src={profileImageFullUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : avatarFallback}
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h2>{firstName} {lastName}</h2>
        {profile?.role && (
          <span style={{ padding: "5px 10px", border: "1px solid #e91e63", borderRadius: "20px", color: "#e91e63" }}>
            {profile.role.replace("ROLE_", "")}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center", marginBottom: "30px" }}>
        <div style={{ border: "1px solid #2196f3", padding: "15px", borderRadius: "10px", minWidth: "150px", textAlign: "center" }}>
          <div style={{ fontWeight: "bold" }}>Email</div>
          <div>{email}</div>
        </div>
        <div style={{ border: "1px solid #4caf50", padding: "15px", borderRadius: "10px", minWidth: "150px", textAlign: "center" }}>
          <div style={{ fontWeight: "bold" }}>Phone</div>
          <div>{phoneNumber}</div>
        </div>
        <div style={{ border: `1px solid ${interest?.color || "#6c757d"}`, padding: "15px", borderRadius: "10px", minWidth: "150px", textAlign: "center" }}>
          <div style={{ fontWeight: "bold" }}>Primary Interest</div>
          <div>{interest?.label || profile?.interest}</div>
        </div>
        {tempEmail && (
          <div style={{ border: "1px solid #9c27b0", padding: "15px", borderRadius: "10px", minWidth: "150px", textAlign: "center" }}>
            <div style={{ fontWeight: "bold" }}>Alternate Email</div>
            <div>{tempEmail}</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={() => navigate("/settings")} style={{ padding: "10px 20px", backgroundColor: "#e91e63", color: "white", border: "none", borderRadius: "20px" }}>
          Edit Profile
        </button>
        <button onClick={() => navigate("/login")} style={{ padding: "10px 20px", backgroundColor: "white", color: "#f44336", border: "1px solid #f44336", borderRadius: "20px" }}>
          Logout
        </button>
      </div>
    </div>
  );
}