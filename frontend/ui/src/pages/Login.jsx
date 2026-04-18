import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
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
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await api.post("/auth/login", form, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.success) {
        setMessage("Login successful! Redirecting...");
        const accessToken = res.data.accessToken || res.data.token;
        if (accessToken) localStorage.setItem("token", accessToken);
        if (res.data.user) localStorage.setItem("user", JSON.stringify(res.data.user));

        setTimeout(() => {
          const role = res.data.role || res.data.user?.role;
          if (role === "ROLE_ADMIN") navigate("/dashboard");
          else if (role === "ROLE_MANAGER") navigate("/management");
          else navigate("/home");
        }, 1500);
      } else {
        setMessage(res.data.message || "Login failed. Check credentials.");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="login-page">
        <div className="login-page__canvas" />

        <div className="login-layout">
          <section className="login-showcase" aria-hidden="true">
            <div className="login-showcase__photo">
              <span className="login-showcase__atom" />
            </div>
          </section>

          <section className="login-card-wrap">
            <div className="login-card">
              <span className="login-card__ornament login-card__ornament--left" aria-hidden="true" />
              <span className="login-card__ornament login-card__ornament--right" aria-hidden="true" />

              <div className="login-card__header">
                <span className="login-card__eyebrow">Sign in</span>
                <h2>Continue your journey</h2>
                <p>Access your account, resources, and community progress.</p>
              </div>

              {message ? (
                  <div className={`message ${message.includes("successful") ? "success" : "error"}`}>
                    {message}
                  </div>
              ) : null}

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="login-email">Email Address</label>
                  <input
                      id="login-email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                  />
                  {errors.email ? <span className="error">{errors.email}</span> : null}
                </div>

                <div className="form-group">
                  <label htmlFor="login-password">Password</label>
                  <div className="password-wrapper">
                    <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                    />
                    <button
                        type="button"
                        className="show-btn"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.password ? <span className="error">{errors.password}</span> : null}
                </div>

                <div className="login-card__meta">
                  <div className="forgot-password">
                    <Link to="/forgot-password">Forgot password?</Link>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="login-btn">
                  {loading ? "Loading..." : "Login"}
                </button>
              </form>

              <div className="login-card__footer">
                <p className="signup-link">
                  New to Uni Learn Hub? <Link to="/signup">Create an account</Link>
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer className="login-page__footer">
          {new Date().getFullYear()} Uni Learn Hub. All rights reserved.
        </footer>
      </div>
  );
}
