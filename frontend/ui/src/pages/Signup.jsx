import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api";
import "./Signup.css";

const steps = ["Personal Information", "Account Details", "Learning Preferences"];
const interests = [
  { value: "BACKEND", label: "Backend Development" },
  { value: "FRONTEND", label: "Frontend Development" },
  { value: "FULLSTACK", label: "Full Stack Development" },
  { value: "DATA_SCIENCE", label: "Data Science" },
];

const STEP_INTROS = [
  "Add your basic profile details to begin your account setup.",
  "Protect your account with the details you will use to sign in.",
  "Pick the learning area you want to explore first in Uni Learn Hub.",
];

export default function Signup() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstname: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    tempEmail: "",
    role: "ROLE_USER",
    interest: "",
  });

  const [errors, setErrors] = useState({});

  const validateStep = async (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!form.firstname.trim()) newErrors.firstname = "First name cannot be empty!";
      if (!form.lastName.trim()) newErrors.lastName = "Last name is required!";
      if (!form.email.trim()) newErrors.email = "Please enter your email";
      else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Enter a valid email";

      if (form.tempEmail.trim() && !form.tempEmail.includes("@")) {
        newErrors.tempEmail = "Alternative email looks invalid";
      }

      if (form.email.trim()) {
        try {
          const res = await api.post("/auth/check-email", { email: form.email });
          if (!res.data.available) newErrors.email = "This email is already registered";
        } catch {}
      }
    }

    if (step === 1) {
      if (!form.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
      else if (!/^\d{10}$/.test(form.phoneNumber)) newErrors.phoneNumber = "Phone must be 10 digits";

      if (!form.password.trim()) newErrors.password = "Password cannot be empty";
      else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";

      if (/^\d{10}$/.test(form.phoneNumber)) {
        try {
          const res = await api.post("/auth/check-phone", { phoneNumber: form.phoneNumber });
          if (!res.data.available) newErrors.phoneNumber = "Phone number already in use";
        } catch {}
      }
    }

    if (step === 2) {
      if (!form.interest.trim()) newErrors.interest = "Please select your learning interest";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNext = async () => {
    const stepErrors = await validateStep(activeStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      Object.values(stepErrors).forEach((msg) => toast.error(msg, { position: "top-right" }));
      return;
    }

    if (activeStep === steps.length - 1) handleSubmit();
    else {
      setActiveStep((prev) => prev + 1);
      toast.success(`Step ${activeStep + 1} completed successfully.`, { position: "top-right" });
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", form, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.data.success) {
        toast.success("Registration successful! Redirecting to OTP verification...", {
          position: "top-right",
        });
        setTimeout(() => navigate("/verify", { state: { email: form.email } }), 1500);
      } else {
        toast.error(res.data.message || "Registration failed. Please try again.", {
          position: "top-right",
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
            <div className="step-content">
              <div className="step-content__intro">
                <p>{STEP_INTROS[0]}</p>
              </div>

              <div className="row">
                <div className="col">
                  <label htmlFor="signup-firstname">First Name</label>
                  <input
                      id="signup-firstname"
                      type="text"
                      name="firstname"
                      value={form.firstname}
                      onChange={handleChange}
                      placeholder="Enter your first name"
                  />
                  {errors.firstname ? <span className="error">{errors.firstname}</span> : null}
                </div>

                <div className="col">
                  <label htmlFor="signup-lastname">Last Name</label>
                  <input
                      id="signup-lastname"
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      placeholder="Enter your last name"
                  />
                  {errors.lastName ? <span className="error">{errors.lastName}</span> : null}
                </div>
              </div>

              <div className="row">
                <div className="col">
                  <label htmlFor="signup-email">Email</label>
                  <input
                      id="signup-email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                  />
                  {errors.email ? <span className="error">{errors.email}</span> : null}
                </div>

                <div className="col">
                  <label htmlFor="signup-temp-email">Alternative Email</label>
                  <input
                      id="signup-temp-email"
                      type="email"
                      name="tempEmail"
                      value={form.tempEmail}
                      onChange={handleChange}
                      placeholder="Recovery email"
                  />
                  <small>Optional recovery email</small>
                  {errors.tempEmail ? <span className="error">{errors.tempEmail}</span> : null}
                </div>
              </div>
            </div>
        );
      case 1:
        return (
            <div className="step-content">
              <div className="step-content__intro">
                <p>{STEP_INTROS[1]}</p>
              </div>

              <div className="row">
                <div className="col">
                  <label htmlFor="signup-phone">Phone Number</label>
                  <input
                      id="signup-phone"
                      type="text"
                      name="phoneNumber"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      placeholder="10 digit phone number"
                  />
                  {errors.phoneNumber ? <span className="error">{errors.phoneNumber}</span> : null}
                </div>

                <div className="col">
                  <label htmlFor="signup-role">Account Type</label>
                  <select id="signup-role" name="role" value={form.role} onChange={handleChange}>
                    <option value="ROLE_USER">Student</option>
                    <option value="ROLE_ADMIN">Instructor</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <div className="password-wrapper">
                  <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
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
            </div>
        );
      case 2:
        return (
            <div className="step-content">
              <div className="step-content__intro">
                <p>{STEP_INTROS[2]}</p>
              </div>

              <div className="interests-grid">
                {interests.map((interest) => (
                    <div
                        key={interest.value}
                        className={`interest-card ${form.interest === interest.value ? "selected" : ""}`}
                        onClick={() => setForm((prev) => ({ ...prev, interest: interest.value }))}
                    >
                      <div className="avatar">{interest.label.charAt(0)}</div>
                      <span>{interest.label}</span>
                    </div>
                ))}
              </div>
              {errors.interest ? <span className="error error--stack">{errors.interest}</span> : null}
            </div>
        );
      default:
        return null;
    }
  };

  const progressWidth = `${((activeStep + 1) / steps.length) * 100}%`;

  return (
      <div className="signup-page">
        <div className="signup-page__canvas" />
        <ToastContainer />

        <div className="signup-layout">
          <section className="signup-showcase" aria-hidden="true">
            <div className="signup-showcase__photo">
              <span className="signup-showcase__atom" />
            </div>
          </section>

          <section className="signup-form-shell">
            <div className="form-card">
              <span className="signup-card__ornament signup-card__ornament--left" aria-hidden="true" />
              <span className="signup-card__ornament signup-card__ornament--right" aria-hidden="true" />

              <div className="header">
                <span className="signup-card__eyebrow">Create account</span>
                <h2>Start your learning journey</h2>
                <p>Join Uni Learn Hub in three simple steps.</p>
              </div>

              <div className="form-header">
                <div>
                  <span className="form-header__eyebrow">Registration flow</span>
                  <h3>{steps[activeStep]}</h3>
                </div>
                <span className="form-header__progress">
                Step {activeStep + 1} of {steps.length}
              </span>
              </div>

              <div className="progress-bar" aria-hidden="true">
                <div className="progress" style={{ width: progressWidth }} />
              </div>

              <div className="stepper">
                {steps.map((label, idx) => (
                    <div
                        key={label}
                        className={`step ${activeStep === idx ? "active" : ""} ${activeStep > idx ? "completed" : ""}`}
                    >
                      <div className="step-icon">{idx + 1}</div>
                      <span>{label}</span>
                    </div>
                ))}
              </div>

              <div className="step-content-wrapper">{renderStepContent(activeStep)}</div>

              <div className="form-actions">
                <button
                    type="button"
                    className="form-actions__ghost"
                    onClick={handleBack}
                    disabled={activeStep === 0 || loading}
                >
                  Back
                </button>

                <div className="form-actions__primary">
                <span>
                  Step {activeStep + 1} of {steps.length}
                </span>
                  <button type="button" onClick={handleNext} disabled={loading}>
                    {loading ? "Loading..." : activeStep === steps.length - 1 ? "Create Account" : "Continue"}
                  </button>
                </div>
              </div>

              <div className="signup-footnote">
                <p>
                  Already have an account? <Link to="/login">Sign in</Link>
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer className="signup-page__footer">
          {new Date().getFullYear()} Uni Learn Hub. All rights reserved.
        </footer>
      </div>
  );
}
