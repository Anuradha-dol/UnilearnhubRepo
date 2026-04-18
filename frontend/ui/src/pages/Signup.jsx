import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
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

  const validateStep = async (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!form.firstname.trim()) newErrors.firstname = "First name cannot be empty!";
      if (!form.lastName.trim()) newErrors.lastName = "Last name is required!";
      if (!form.email.trim()) newErrors.email = "Please enter your email";
      else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Enter a valid email";

      if (form.tempEmail.trim() && !form.tempEmail.includes("@")) newErrors.tempEmail = "Alternative email looks invalid";

      if (form.email.trim()) {
        try {
          const res = await api.post("/auth/check-email", { email: form.email });
          if (!res.data.available) newErrors.email = "This email is already registered";
        } catch {/*ss*/}
      }
    }

    if (step === 1) {
      if (!form.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
      else if (!/^\d{10}$/.test(form.phoneNumber)) newErrors.phoneNumber = "Phone must be 10 digits";

      if (!form.password.trim()) newErrors.password = "Password cannot be empty";
      else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";

      <input
  type="text"
  value={form.phoneNumber}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, ""); // remove non-digits
    setForm({ ...form, phoneNumber: value });
  }}
/>

      if (/^\d{10}$/.test(form.phoneNumber)) {
        try {
          const res = await api.post("/auth/check-phone", { phoneNumber: form.phoneNumber });
          if (!res.data.available) newErrors.phoneNumber = "Phone number already in use";
        } catch {/*ss*/}
      }
    }

    if (step === 2) {
      if (!form.interest.trim()) newErrors.interest = "Please select your learning interest";
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleNext = async () => {
    const stepErrors = await validateStep(activeStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      // Show each error as a popup
      Object.values(stepErrors).forEach(msg => toast.error(msg, { position: "top-right" }));
      return;
    }
    if (activeStep === steps.length - 1) handleSubmit();
    else {
      setActiveStep(prev => prev + 1);
      toast.success(`Step ${activeStep + 1} completed successfully! ✨`, { position: "top-right" });
    }
  };

  const handleBack = () => setActiveStep(prev => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", form, { headers: { "Content-Type": "application/json" } });
      if (res.data.success) {
        toast.success("🎉 Registration successful! Redirecting to OTP verification...", { position: "top-right" });
        setTimeout(() => navigate("/verify", { state: { email: form.email } }), 1500);
      } else {
        toast.error(res.data.message || "Registration failed. Please try again.", { position: "top-right" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.", { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch(step) {
      case 0:
        return (
          <div className="step-content">
            <h3>Personal Information</h3>
            <div className="row">
              <div className="col">
                <label>First Name</label>
                <input type="text" name="firstname" value={form.firstname} onChange={handleChange} />
              </div>
              <div className="col">
                <label>Last Name</label>
                <input type="text" name="lastName" value={form.lastName} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Alternative Email (Optional)</label>
              <input type="email" name="tempEmail" value={form.tempEmail} onChange={handleChange} />
              <small>For recovery purposes</small>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="step-content">
            <h3>Account Security</h3>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button>
              </div>
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
            <div className="interests-grid">
              {interests.map(i => (
                <div key={i.value} className={`interest-card ${form.interest===i.value?'selected':''}`} 
                     onClick={() => setForm(prev=>({...prev, interest: i.value}))}>
                  <div className="avatar">{i.label.charAt(0)}</div>
                  <span>{i.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      default: return null;
    }
  }

  return (
    <div className="signup-page">
      <ToastContainer />
      <div className="signup-container">
        <div className="header">
          <h1>UNI Learn Hub</h1>
          <p>Join our vibrant community of learners and educators</p>
        </div>

        <div className="form-card">
          <div className="form-header">
            <h2>Create Account</h2>
            <p>Complete your registration in 3 simple steps</p>
          </div>

          <div className="stepper">
            {steps.map((label, idx) => (
              <div key={idx} className={`step ${activeStep===idx?'active':''} ${activeStep>idx?'completed':''}`}>
                <div className="step-icon">{activeStep>idx?'✓':idx+1}</div>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="step-content-wrapper">{renderStepContent(activeStep)}</div>

          <div className="form-actions">
            <button onClick={handleBack} disabled={activeStep===0 || loading}>Back</button>
            <div>
              <span>Step {activeStep+1} of {steps.length}</span>
              <button onClick={handleNext} disabled={loading}>
                {loading?"⏳ Loading...": activeStep===steps.length-1?"Create Account":"Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}