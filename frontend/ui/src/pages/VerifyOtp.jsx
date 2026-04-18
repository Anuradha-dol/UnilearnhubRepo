import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import api from "../api";

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
    <div
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        fontFamily: "Arial",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <ToastContainer />
      <h2>Verify OTP</h2>

      <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="text"
          name="otp"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />

        <button type="submit" disabled={loading} style={{ padding: "10px" }}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>

      <button
        onClick={handleResend}
        disabled={loading}
        style={{ padding: "10px", marginTop: "10px" }}
      >
        {loading ? "Sending..." : "Resend OTP"}
      </button>
    </div>
  );
}