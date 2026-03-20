
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Settings() {
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    profileImageUrl: "",
    coverImageUrl: "",
  });

  const [nameForm, setNameForm] = useState({ name: "", lastName: "" });
  const [emailForm, setEmailForm] = useState({ newEmail: "", otp: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [deleteForm, setDeleteForm] = useState({ currentPassword: "" });

  const [profileFile, setProfileFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/user/me", { withCredentials: true });
        const data = res.data;
        setUser({
          firstName: data.firstName || data.firstname || data.name || "",
          lastName: data.lastName || data.lastname || "",
          profileImageUrl: data.profileImageUrl || data.imageUrl || "",
          coverImageUrl: data.coverImageUrl || "",
        });
        setNameForm({
          name: data.firstName || data.firstname || data.name || "",
          lastName: data.lastName || data.lastname || "",
        });
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  const handleResponse = (res, redirectLogin = false) => {
    setMessage(res.data?.message || "Success");
    setError("");
    if (redirectLogin) setTimeout(() => navigate("/login"), 1500);
  };

  const handleError = (err) => {
    setError(err.response?.data?.message || "Something went wrong");
    setMessage("");
  };

  const updateName = async () => {
    setLoading(true);
    try {
      const res = await api.put("/user/update-name", nameForm, { withCredentials: true });
      handleResponse(res);
      setUser({ ...user, firstName: nameForm.name, lastName: nameForm.lastName });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const requestEmailUpdate = async () => {
    setLoading(true);
    try {
      const res = await api.put("/user/update-email", { newEmail: emailForm.newEmail }, { withCredentials: true });
      handleResponse(res);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const verifyNewEmail = async () => {
    setLoading(true);
    try {
      const res = await api.post("/user/verify-new-email", null, {
        params: { otp: emailForm.otp },
        withCredentials: true,
      });
      handleResponse(res, true);
      setEmailDialogOpen(false);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    setLoading(true);
    try {
      const res = await api.put("/user/update-password", passwordForm, { withCredentials: true });
      handleResponse(res, true);
      setPasswordDialogOpen(false);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      const res = await api.delete("/user/delete", { data: deleteForm, withCredentials: true });
      handleResponse(res, true);
      setDeleteDialogOpen(false);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", profileFile);
    try {
      const res = await api.post("/user/upload-profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setMessage("Profile image uploaded successfully!");
      setUser({ ...user, profileImageUrl: res.data.imageUrl || res.data });
      setProfileFile(null);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const uploadCoverImage = async () => {
    if (!coverFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", coverFile);
    try {
      const res = await api.post("/user/upload-cover-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setMessage("Cover image uploaded successfully!");
      setUser({ ...user, coverImageUrl: res.data.imageUrl || res.data });
      setCoverFile(null);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1>Account Settings</h1>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Upload Profile Picture</h2>
      <input type="file" accept="image/*" onChange={(e) => setProfileFile(e.target.files[0])} />
      <button onClick={uploadProfileImage} disabled={!profileFile || uploading}>
        Upload
      </button>

      <h2>Upload Cover Photo</h2>
      <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} />
      <button onClick={uploadCoverImage} disabled={!coverFile || uploading}>
        Upload
      </button>

      <h2>Update Name</h2>
      <input
        placeholder="First Name"
        value={nameForm.name}
        onChange={(e) => setNameForm({ ...nameForm, name: e.target.value })}
      />
      <input
        placeholder="Last Name"
        value={nameForm.lastName}
        onChange={(e) => setNameForm({ ...nameForm, lastName: e.target.value })}
      />
      <button onClick={updateName} disabled={loading}>
        Save Changes
      </button>

      <h2>Update Email</h2>
      <input
        placeholder="New Email"
        type="email"
        value={emailForm.newEmail}
        onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
      />
      <button onClick={requestEmailUpdate} disabled={loading || !emailForm.newEmail}>
        Request Verification
      </button>
      <input
        placeholder="OTP"
        value={emailForm.otp}
        onChange={(e) => setEmailForm({ ...emailForm, otp: e.target.value })}
      />
      <button onClick={verifyNewEmail} disabled={!emailForm.otp}>
        Verify Email
      </button>

      <h2>Update Password</h2>
      <input
        placeholder="Current Password"
        type={showPassword.current ? "text" : "password"}
        value={passwordForm.currentPassword}
        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
      />
      <input
        placeholder="New Password"
        type={showPassword.new ? "text" : "password"}
        value={passwordForm.newPassword}
        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
      />
      <input
        placeholder="Confirm New Password"
        type={showPassword.confirm ? "text" : "password"}
        value={passwordForm.confirmPassword}
        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
      />
      <button onClick={updatePassword}>Update Password</button>

      <h2>Delete Account</h2>
      <input
        placeholder="Current Password"
        type="password"
        value={deleteForm.currentPassword}
        onChange={(e) => setDeleteForm({ currentPassword: e.target.value })}
      />
      <button onClick={deleteAccount}>Delete Account</button>
    </div>
  );
}