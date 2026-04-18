import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Settings.css";

export default function Settings() {
  const navigate = useNavigate();

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

  //VALIDATIONS

  const validateName = () => {
    if (!nameForm.name.trim()) return toast.error("First name is required");
    if (!nameForm.lastName.trim()) return toast.error("Last name is required");
    return true;
  };

  const validateEmail = () => {
    if (!emailForm.newEmail) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(emailForm.newEmail))
      return toast.error("Invalid email format");
    return true;
  };

  const validatePassword = () => {
    if (!passwordForm.currentPassword)
      return toast.error("Current password required");
    if (passwordForm.newPassword.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      return toast.error("Passwords do not match");
    return true;
  };

  const validateDelete = () => {
    if (!deleteForm.currentPassword)
      return toast.error("Enter password to delete account");
    return true;
  };

  //HANDLERS

  const handleResponse = (res, redirectLogin = false) => {
    toast.success(res.data?.message || "Success");
    if (redirectLogin) setTimeout(() => navigate("/login"), 1500);
  };

  const handleError = (err) => {
    toast.error(err.response?.data?.message || "Something went wrong");
  };

  const updateName = async () => {
    if (!validateName()) return;

    setLoading(true);
    try {
      const res = await api.put("/user/update-name", nameForm, {
        withCredentials: true,
      });
      handleResponse(res);
      setUser({ ...user, firstName: nameForm.name, lastName: nameForm.lastName });
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const requestEmailUpdate = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      const res = await api.put(
        "/user/update-email",
        { newEmail: emailForm.newEmail },
        { withCredentials: true }
      );
      handleResponse(res);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const verifyNewEmail = async () => {
    if (!emailForm.otp) return toast.error("OTP required");

    setLoading(true);
    try {
      const res = await api.post("/user/verify-new-email", null, {
        params: { otp: emailForm.otp },
        withCredentials: true,
      });
      handleResponse(res, true);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!validatePassword()) return;

    setLoading(true);
    try {
      const res = await api.put("/user/update-password", passwordForm, {
        withCredentials: true,
      });
      handleResponse(res, true);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!validateDelete()) return;

    setLoading(true);
    try {
      const res = await api.delete("/user/delete", {
        data: deleteForm,
        withCredentials: true,
      });
      handleResponse(res, true);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileFile) return toast.error("Select a profile image");

    setUploading(true);
    const formData = new FormData();
    formData.append("file", profileFile);

    try {
      const res = await api.post("/user/upload-profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      toast.success("Profile image uploaded!");
      setUser({ ...user, profileImageUrl: res.data.imageUrl || res.data });
    } catch (err) {
      handleError(err);
    } finally {
      setUploading(false);
    }
  };

  const uploadCoverImage = async () => {
    if (!coverFile) return toast.error("Select a cover image");

    setUploading(true);
    const formData = new FormData();
    formData.append("file", coverFile);

    try {
      const res = await api.post("/user/upload-cover-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      toast.success("Cover image uploaded!");
      setUser({ ...user, coverImageUrl: res.data.imageUrl || res.data });
    } catch (err) {
      handleError(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="settings-container">
      <ToastContainer />

      <h1>Account Settings</h1>

      <div className="card">
        <h2>Profile Image</h2>
        <input type="file" onChange={(e) => setProfileFile(e.target.files[0])} />
        <button onClick={uploadProfileImage}>Upload</button>
      </div>

      <div className="card">
        <h2>Cover Image</h2>
        <input type="file" onChange={(e) => setCoverFile(e.target.files[0])} />
        <button onClick={uploadCoverImage}>Upload</button>
      </div>

      <div className="card">
        <h2>Update Name</h2>
        <input
          placeholder="First Name"
          value={nameForm.name}
          onChange={(e) =>
            setNameForm({ ...nameForm, name: e.target.value })
          }
        />
        <input
          placeholder="Last Name"
          value={nameForm.lastName}
          onChange={(e) =>
            setNameForm({ ...nameForm, lastName: e.target.value })
          }
        />
        <button onClick={updateName}>Save</button>
      </div>

      <div className="card">
        <h2>Update Email</h2>
        <input
          placeholder="New Email"
          value={emailForm.newEmail}
          onChange={(e) =>
            setEmailForm({ ...emailForm, newEmail: e.target.value })
          }
        />
        <button onClick={requestEmailUpdate}>Request OTP</button>

        <input
          placeholder="OTP"
          value={emailForm.otp}
          onChange={(e) =>
            setEmailForm({ ...emailForm, otp: e.target.value })
          }
        />
        <button onClick={verifyNewEmail}>Verify</button>
      </div>

      <div className="card">
        <h2>Update Password</h2>
        <input
          type="password"
          placeholder="Current Password"
          onChange={(e) =>
            setPasswordForm({
              ...passwordForm,
              currentPassword: e.target.value,
            })
          }
        />
        <input
          type="password"
          placeholder="New Password"
          onChange={(e) =>
            setPasswordForm({
              ...passwordForm,
              newPassword: e.target.value,
            })
          }
        />
        <input
          type="password"
          placeholder="Confirm Password"
          onChange={(e) =>
            setPasswordForm({
              ...passwordForm,
              confirmPassword: e.target.value,
            })
          }
        />
        <button onClick={updatePassword}>Update</button>
      </div>

      <div className="card danger">
        <h2>Delete Account</h2>
        <input
          type="password"
          placeholder="Password"
          onChange={(e) =>
            setDeleteForm({ currentPassword: e.target.value })
          }
        />
        <button onClick={deleteAccount}>Delete</button>
      </div>
    </div>
  );
}