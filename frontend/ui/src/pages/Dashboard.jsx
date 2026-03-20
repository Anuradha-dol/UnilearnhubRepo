
import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/admin/dashboard"); 
        setData(res.data);
      } catch (err) {
        console.error(err);

        if (err.response?.status === 401) {
          navigate("/login"); 
        } else if (err.response?.status === 403) {
          setError("Access denied (Admin only)");
        } else {
          setError(err.response?.data?.message || "Failed to load dashboard");
        }
      }
    };

    fetchDashboard();
  }, [navigate]);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!data) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Admin Dashboard</h2>

      <p>{data.welcomeMessage}</p>
      <p>Notifications: {data.notifications}</p>
      <p>Tasks: {data.tasks}</p>

  
      <div style={{ marginTop: "20px" }}>
        <button onClick={() => navigate("/profile")}>Go to Profile</button>

        <button
          style={{
            marginLeft: "10px",
            backgroundColor: "#000",
            color: "#fff",
          }}
          onClick={() => navigate("/supportAdmin")}
        >
          Go to Support Panel
        </button>

        <button
          style={{
            marginLeft: "10px",
            backgroundColor: "#007BFF",
            color: "#fff",
          }}
          onClick={() => navigate("/resources-management")}
        >
          Resources Management
        </button>
      </div>
    </div>
  );
}