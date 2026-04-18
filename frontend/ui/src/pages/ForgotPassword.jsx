import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../api";
import "./ForgotPassword.css";

const steps = ["Contact", "Verify OTP", "New Password"];

const STEP_INTROS = [
  "Use the email or phone number attached to your account so we can send a secure verification code.",
  "Enter the six-digit code we sent you. You can request another code once the timer ends.",
  "Choose a fresh password that is easy for you to remember and hard for others to guess.",
];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [form, setForm] = useState({
    email: "",
    tempEmail: "",
    phoneNumber: "",
    otp: "",
    password: "",
    repeatPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (otpTimer === 0) return undefined;

    const timer = window.setTimeout(() => {
      setOtpTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [otpTimer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!form.email.trim() && !form.phoneNumber.trim()) {
        newErrors.email = "Email or phone required";
      }

      if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
        newErrors.email = "Invalid email";
      }
    } else if (currentStep === 2) {
      if (!form.otp.trim()) newErrors.otp = "OTP required";
      else if (!/^\d{6}$/.test(form.otp)) newErrors.otp = "OTP must be 6 digits";
    } else if (currentStep === 3) {
      if (!form.password.trim()) newErrors.password = "Password required";
      else if (form.password.length < 8) newErrors.password = "Minimum 8 characters";

      if (!form.repeatPassword.trim()) newErrors.repeatPassword = "Confirm password";
      else if (form.password !== form.repeatPassword) newErrors.repeatPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const startOtpTimer = () => {
    setOtpTimer(60);
  };

  const handleSendOtp = async () => {
    const stepErrors = validateStep(1);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      Object.values(stepErrors).forEach((msg) => toast.error(msg));
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await api.post("/forgotpass/send-otp", form, { withCredentials: true });
      const nextMessage = res.data.message || "OTP sent!";
      setMessage(nextMessage);
      toast.success(nextMessage);
      startOtpTimer();
      setStep(2);
    } catch (err) {
      const nextMessage = err.response?.data?.message || "Failed to send OTP";
      setMessage(nextMessage);
      toast.error(nextMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const stepErrors = validateStep(2);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      Object.values(stepErrors).forEach((msg) => toast.error(msg));
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/forgotpass/verify-otp", { otp: form.otp }, { withCredentials: true });
      const nextMessage = res.data.message || "OTP verified";
      setMessage(nextMessage);
      toast.success(nextMessage);
      setStep(3);
    } catch (err) {
      const nextMessage = err.response?.data?.message || "Invalid OTP";
      setMessage(nextMessage);
      toast.error(nextMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);

    try {
      const res = await api.post("/forgotpass/resend-otp", {}, { withCredentials: true });
      const nextMessage = res.data.message || "OTP resent";
      setMessage(nextMessage);
      toast.success(nextMessage);
      startOtpTimer();
    } catch (err) {
      const nextMessage = err.response?.data?.message || "Resend failed";
      setMessage(nextMessage);
      toast.error(nextMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const stepErrors = validateStep(3);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      Object.values(stepErrors).forEach((msg) => toast.error(msg));
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/forgotpass/change-password", form, { withCredentials: true });
      const nextMessage = res.data.message || "Password changed!";
      setMessage(nextMessage);
      toast.success(nextMessage);
      window.setTimeout(() => {
        navigate("/login", { state: { message: "Password reset successful" } });
      }, 2000);
    } catch (err) {
      const nextMessage = err.response?.data?.message || "Failed to change password";
      setMessage(nextMessage);
      toast.error(nextMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 1) navigate("/login");
    else setStep((prev) => prev - 1);
  };

  const handlePrimaryAction = () => {
    if (step === 1) handleSendOtp();
    else if (step === 2) handleVerifyOtp();
    else handleChangePassword();
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
          <div className="forgot-step-content">
            <div className="forgot-step-content__intro">
              <p>{STEP_INTROS[0]}</p>
            </div>

            <div className="forgot-row">
              <div className="forgot-col">
                <label htmlFor="forgot-email">Email address</label>
                <input
                    id="forgot-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                />
                {errors.email ? <span className="forgot-error">{errors.email}</span> : null}
              </div>

              <div className="forgot-col">
                <label htmlFor="forgot-phone">Phone number</label>
                <input
                    id="forgot-phone"
                    type="text"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    placeholder="07XXXXXXXX"
                />
              </div>
            </div>

            <div className="forgot-form-group">
              <label htmlFor="forgot-temp-email">Alternative email</label>
              <input
                  id="forgot-temp-email"
                  type="email"
                  name="tempEmail"
                  value={form.tempEmail}
                  onChange={handleChange}
                  placeholder="Optional recovery email"
              />
              <span className="forgot-helper">Optional, if you added one when creating your account.</span>
            </div>
          </div>
      );
    }

    if (step === 2) {
      return (
          <div className="forgot-step-content">
            <div className="forgot-step-content__intro">
              <p>{STEP_INTROS[1]}</p>
            </div>

            <div className="forgot-form-group">
              <label htmlFor="forgot-otp">Verification code</label>
              <input
                  id="forgot-otp"
                  type="text"
                  name="otp"
                  value={form.otp}
                  onChange={handleChange}
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
              />
              {errors.otp ? <span className="forgot-error">{errors.otp}</span> : null}
            </div>

            <div className="otp-controls">
              <button type="button" onClick={handleResendOtp} disabled={otpTimer > 0 || loading}>
                {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend code"}
              </button>
              <span>Sent to {form.email || form.phoneNumber}</span>
            </div>
          </div>
      );
    }

    return (
        <div className="forgot-step-content">
          <div className="forgot-step-content__intro">
            <p>{STEP_INTROS[2]}</p>
          </div>

          <div className="forgot-form-group">
            <label htmlFor="forgot-password">New password</label>
            <div className="forgot-password-wrapper">
              <input
                  id="forgot-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
              />
              <button
                  type="button"
                  className="forgot-show-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password ? <span className="forgot-error">{errors.password}</span> : null}
          </div>

          <div className="forgot-form-group">
            <label htmlFor="forgot-repeat-password">Confirm password</label>
            <div className="forgot-password-wrapper">
              <input
                  id="forgot-repeat-password"
                  type={showConfirmPassword ? "text" : "password"}
                  name="repeatPassword"
                  value={form.repeatPassword}
                  onChange={handleChange}
                  placeholder="Repeat your new password"
              />
              <button
                  type="button"
                  className="forgot-show-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.repeatPassword ? <span className="forgot-error">{errors.repeatPassword}</span> : null}
          </div>
        </div>
    );
  };

  const progressWidth = `${(step / steps.length) * 100}%`;

  return (
      <div className="forgot-page">
        <div className="forgot-page__canvas" />
        <ToastContainer position="top-right" />

        <div className="forgot-layout">
          <section className="forgot-showcase" aria-hidden="true">
            <div className="forgot-showcase__photo">
              <span className="forgot-showcase__atom" />

              <div className="forgot-showcase__content">
                <span className="forgot-showcase__eyebrow">Account recovery</span>
                <h1>Reset access without losing your progress.</h1>
                <p>
                  Verify your identity, create a secure password, and return to Uni Learn Hub with the
                  same smooth experience as sign in and sign up.
                </p>
              </div>
            </div>
          </section>

          <section className="forgot-card-wrap">
            <div className="forgot-card">
              <span className="forgot-card__ornament forgot-card__ornament--left" aria-hidden="true" />
              <span className="forgot-card__ornament forgot-card__ornament--right" aria-hidden="true" />

              <div className="forgot-card__header">
                <span className="forgot-card__eyebrow">Forgot password</span>
                <h2>Recover your account</h2>
                <p>Complete the secure three-step flow to set a new password.</p>
              </div>

              {message ? (
                  <div className={`forgot-message ${message.toLowerCase().includes("fail") || message.toLowerCase().includes("invalid") ? "error" : "success"}`}>
                    {message}
                  </div>
              ) : null}

              <div className="forgot-flow-header">
                <div>
                  <span className="forgot-flow-header__eyebrow">Recovery flow</span>
                  <h3>{steps[step - 1]}</h3>
                </div>
                <span className="forgot-flow-header__progress">
                Step {step} of {steps.length}
              </span>
              </div>

              <div className="forgot-progress-bar" aria-hidden="true">
                <div className="forgot-progress" style={{ width: progressWidth }} />
              </div>

              <div className="forgot-stepper">
                {steps.map((label, index) => (
                    <div
                        key={label}
                        className={`forgot-step ${step === index + 1 ? "active" : ""} ${step > index + 1 ? "completed" : ""}`}
                    >
                      <div className="forgot-step__icon">{index + 1}</div>
                      <span>{label}</span>
                    </div>
                ))}
              </div>

              <div className="forgot-step-content-wrapper">{renderStepContent()}</div>

              <div className="forgot-form-actions">
                <button type="button" className="forgot-form-actions__ghost" onClick={handleBack} disabled={loading}>
                  {step === 1 ? "Back to login" : "Back"}
                </button>

                <div className="forgot-form-actions__primary">
                <span>
                  {step === 1 ? "Send your code" : step === 2 ? "Confirm the code" : "Save your password"}
                </span>
                  <button type="button" onClick={handlePrimaryAction} disabled={loading}>
                    {loading ? "Loading..." : step === 1 ? "Send OTP" : step === 2 ? "Verify" : "Reset password"}
                  </button>
                </div>
              </div>

              <div className="forgot-card__footer">
                <p>
                  Remember your password? <Link to="/login">Sign in</Link>
                </p>
                <p>
                  Need a new account? <Link to="/signup">Create one</Link>
                </p>
              </div>
            </div>
          </section>
        </div>

        <footer className="forgot-page__footer">
          {new Date().getFullYear()} Uni Learn Hub. All rights reserved.
        </footer>
      </div>
  );
}
