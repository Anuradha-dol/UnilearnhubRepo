import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


import api from "../api";
import "./Home.css";

export default function Home() {
  const [user, setUser] = useState(null);
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

  if (error) return <p className="error">{error}</p>;
  if (!user) return <p className="loading">Loading...</p>;

  const navItems = [
    { label: "Profile", path: "/profile" },
    { label: "Resources", path: "/resources" },
    { label: "Support", path: "/SupportUser" },
    { label: "Review", path: "/Review" },
    { label: "Tasks", path: "/taskPage" },
  ];

  return (
    <div className="home-container">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-left">
          <h2 className="logo">MyApp</h2>
        </div>
        <div className="nav-right">
          {navItems.map((item) => (
            <button
              key={item.label}
              className="nav-btn"
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Left Sidebar */}
        <aside className="sidebar">
          <div className="user-card">
            <h3>Welcome, {user.firstname || user.name}!</h3>
            <p>Role: <strong>{user.role}</strong></p>
          </div>

         
        </aside>

      </div>
    </div>
  );
}