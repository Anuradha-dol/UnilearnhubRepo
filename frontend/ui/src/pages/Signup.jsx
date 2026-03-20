
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import "./Signup.css"; 

const steps = ["Personal Information", "Account Details", "Learning Preferences"];

const interests = [
  { value: "BACKEND", label: "Backend Development" },
  { value: "FRONTEND", label: "Frontend Development" },
  { value: "FULLSTACK", label: "Full Stack Development" },
  { value: "DATA_SCIENCE", label: "Data Science" },
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
  const [formError, setFormError] = useState("");

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 0) {
      if (!form.firstname.trim()) newErrors.firstname = "First name is required";
      if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
      if (!form.email.trim()) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email";
    } else if (step === 1) {
      if (!form.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
      if (!form.password.trim()) newErrors.password = "Password is required";
      else if (form.password.length < 6) newErrors.password = "Minimum 6 characters";
    } else if (step === 2) {
      if (!form.interest.trim()) newErrors.interest = "Please select an interest";
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNext = () => {
    const stepErrors = validateStep(activeStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    if (activeStep === steps.length - 1) handleSubmit();
    else setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setFormError("");
    try {
      const res = await api.post("/auth/register", form, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.data.success) {
        navigate("/verify", { state: { email: form.email } });
      } else {
        setFormError(res.data.message || "Registration failed");
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <div className="step-content">
            <h3>Basic Information</h3>
            <div className="row">
              <div className="col">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstname"
                  value={form.firstname}
                  onChange={handleChange}
                />
                {errors.firstname && <span className="error">{errors.firstname}</span>}
              </div>
              <div className="col">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                />
                {errors.lastName && <span className="error">{errors.lastName}</span>}
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>
            <p className="info-box">Use your institutional email for academic benefits</p>
          </div>
        );
      case 1:
        return (
          <div className="step-content">
            <h3>Account Security</h3>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
              />
              {errors.phoneNumber && <span className="error">{errors.phoneNumber}</span>}
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
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <span className="error">{errors.password}</span>}
            </div>
            <div className="form-group">
              <label>Alternative Email (Optional)</label>
              <input
                type="email"
                name="tempEmail"
                value={form.tempEmail}
                onChange={handleChange}
              />
              <small>For recovery</small>
            </div>
            <div className="form-group">
              <label>Account Type</label>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="ROLE_USER">Student</option>
                <option value="ROLE_ADMIN">Instructor</option>
              </select>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="step-content">
            <h3>Learning Preferences</h3>
            <p>Select your primary interest</p>
            <div className="interests-grid">
              {interests.map((interest) => (
                <div
                  key={interest.value}
                  className={`interest-card ${form.interest === interest.value ? "selected" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, interest: interest.value }))}
                >
                  <div className="avatar">{interest.label.charAt(0)}</div>
                  <span>{interest.label}</span>
                  {form.interest === interest.value && <small>Selected</small>}
                </div>
              ))}
            </div>
            {errors.interest && <span className="error">{errors.interest}</span>}
            <hr />
            <p className="note">You can change these anytime</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="header">
          <h1>UNI Learn Hub</h1>
          <p>Join our community of learners and educators</p>
        </div>

        <div className="form-card">
          <div className="form-header">
            <h2>Create Account</h2>
            <p>Complete your registration in 3 simple steps</p>
          </div>

          <div className="stepper">
            {steps.map((label, idx) => (
              <div key={idx} className={`step ${activeStep === idx ? "active" : ""} ${activeStep > idx ? "completed" : ""}`}>
                <div className="step-icon">{activeStep > idx ? "✓" : idx + 1}</div>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="step-content-wrapper">{renderStepContent(activeStep)}</div>

          {formError && <div className="form-error">{formError}</div>}

          <div className="form-actions">
            <button onClick={handleBack} disabled={activeStep === 0 || loading}>Back</button>
            <div>
              <span>Step {activeStep + 1} of {steps.length}</span>
              <button onClick={handleNext} disabled={loading}>
                {loading ? "Loading..." : activeStep === steps.length - 1 ? "Create Account" : "Continue"}
              </button>
            </div>
          </div>

          <div className="progress-bar">
            <div
              className="progress"
              style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <p className="login-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>

        <p className="terms">
          By creating an account, you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}