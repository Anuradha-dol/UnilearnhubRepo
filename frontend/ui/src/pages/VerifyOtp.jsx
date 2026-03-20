import { useState } from "react";
import api from "../api";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
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
      setMessage("OTP is required");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(
        "/auth/verify-code",
        { verifyCode: otp },
        { withCredentials: true }
      );

      setMessage(toMessage(res.data));

      if (res.data.success) {
   
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      }
    } catch (err) {
      console.error(err.response?.data || err);
      setMessage(toMessage(err.response?.data));
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
      setMessage(toMessage(res.data));
    } catch (err) {
      console.error(err.response?.data || err);
      setMessage(toMessage(err.response?.data));
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
      <h2>Verify OTP</h2>

      {message && (
        <p style={{ color: message.toLowerCase().includes("error") ? "red" : "green" }}>
          {message}
        </p>
      )}

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
