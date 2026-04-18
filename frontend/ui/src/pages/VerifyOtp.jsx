import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import api from "../api";
import "./VerifyOtp.css";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const toMessage = (data) => {
    if (!data) return "Something went wrong";
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    return "Something went wrong";
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error("OTP is required", { position: "top-right" });
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(
        "/auth/verify-code",
        { verifyCode: otp },
        { withCredentials: true }
      );

      const msg = toMessage(res.data);

      if (res.data.success) {
        toast.success(msg || "OTP verified successfully! 🎉", { position: "top-right" });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else {
        toast.error(msg, { position: "top-right" });
      }
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error(toMessage(err.response?.data), { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      const res = await api.post(
        "/auth/resend-otp",
        {},
        { withCredentials: true }
      );
      toast.info(toMessage(res.data) || "OTP resent successfully! ✨", { position: "top-right" });
    } catch (err) {
      console.error(err.response?.data || err);
      toast.error(toMessage(err.response?.data), { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-page__canvas" />
      <ToastContainer />

      <div className="verify-layout">
        <section className="verify-showcase" aria-hidden="true">
          <div className="verify-showcase__photo">
            <span className="verify-showcase__atom" />

            <div className="verify-showcase__content">
              <span className="verify-showcase__eyebrow">Account Security</span>
              <h1>Finish verifying your account</h1>
              <p>
                Enter the one-time password we sent to continue into Uni Learn Hub.
                If the code expires, you can request a fresh OTP instantly.
              </p>
            </div>
          </div>
        </section>

        <section className="verify-card-wrap">
          <div className="verify-card">
            <span className="verify-card__ornament verify-card__ornament--left" aria-hidden="true" />
            <span className="verify-card__ornament verify-card__ornament--right" aria-hidden="true" />

            <div className="verify-card__header">
              <span className="verify-card__eyebrow">Verify OTP</span>
              <h2>Confirm your code</h2>
              <p>
                Use the latest verification code from your email to activate your
                sign-in access.
              </p>
            </div>

            <form onSubmit={handleVerify} className="verify-form">
              <div className="verify-form-group">
                <label htmlFor="verify-otp">Verification code</label>
                <input
                  id="verify-otp"
                  type="text"
                  name="otp"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <span className="verify-helper">
                  Enter the OTP exactly as received in your inbox.
                </span>
              </div>

              <button type="submit" disabled={loading} className="verify-btn verify-btn--primary">
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>

            <div className="verify-actions">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="verify-btn verify-btn--secondary"
              >
                {loading ? "Sending..." : "Resend OTP"}
              </button>
              <p className="verify-footnote">
                We will redirect you to login after successful verification.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="verify-page__footer">
        {new Date().getFullYear()} Uni Learn Hub. All rights reserved.
      </footer>
    </div>
  );
}
