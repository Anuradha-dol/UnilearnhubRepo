import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import api from "../api";
import "./Login.css"; 

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email address";
    if (!form.password.trim()) newErrors.password = "Password is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      //show validation errors as toast
      Object.values(validationErrors).forEach(msg =>
        toast.error(msg, { position: "top-right" })
      );

      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/login", form, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.success) {
        toast.success("🎉 Login successful! Redirecting...", { position: "top-right" });

        if (res.data.token) localStorage.setItem("token", res.data.token);
        if (res.data.user) localStorage.setItem("user", JSON.stringify(res.data.user));

        setTimeout(() => {
          const role = res.data.role || res.data.user?.role;
          if (role === "ROLE_ADMIN") navigate("/dashboard");
          else if (role === "ROLE_MANAGER") navigate("/management");
          else navigate("/home");
        }, 1500);

      } else {
        toast.error(res.data.message || "Login failed. Check credentials.", { position: "top-right" });
      }

    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to connect to server.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      
  
      <ToastContainer />

      <div className="login-container">
    
        <div className="login-info">
          <h1>Uni Learn Hub</h1>
          <p>Where knowledge meets community</p>
          <ul>
            <li>Get expert answers to your questions</li>
            <li>Connect with thousands of IT professionals</li>
            <li>Practical knowledge for career growth</li>
          </ul>
          <p>Join 50,000+ learners already sharing solutions.</p>
        </div>

        <div className="login-card">
          <h2>Welcome Back</h2>
          <p>Sign in to continue your learning journey</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="show-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <span className="error">{errors.password}</span>}
            </div>

            <div className="forgot-password">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? "⏳ Logging in..." : "Login"}
            </button>
          </form>

          <p className="signup-link">
            New to Uni Learn Hub? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>

      <footer>
        © {new Date().getFullYear()} Uni Learn Hub. All rights reserved.
      </footer>
    </div>
  );
}