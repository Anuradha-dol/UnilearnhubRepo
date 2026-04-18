import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "../pages/Home.css";

const YEARS = ["FIRST", "SECOND", "THIRD", "FOURTH"];
const SEMESTERS = ["SEM1", "SEM2"];
const VIDEO_EXTENSIONS = ["mp4", "mov", "avi", "mkv", "webm", "m4v"];
const MIN_DESCRIPTION_LENGTH = 20;
const MAX_VIDEO_SIZE_MB = 250;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function errorMessage(err, fallback) {
  return err?.response?.data?.message || err?.response?.data || fallback;
}

export default function ResourcesManagement() {
  const backendBase =
    api.defaults.baseURL || (typeof window !== "undefined" ? window.location.origin : "");
  const [videos, setVideos] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [formError, setFormError] = useState("");

  const navigate = useNavigate();
  const adminNavItems = [
    { label: "Profile", path: "/profile" },
    { label: "Support", path: "/SupportAdmin" },
    { label: "Resources", path: "/resources-management" },
    { label: "Admin Tasks", path: "/admin-task-manager" },
  ];

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await api.get("/api/videos/my", { withCredentials: true });
      setVideos(res.data);
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setYear("");
    setSemester("");
    setAcademicYear("");
    setEditingVideoId(null);
    setFormError("");
  };

  const validateAcademicYear = () => {
    if (!academicYear.trim()) {
      setFormError("Please enter an academic year.");
      return false;
    }
    if (!/^\d{4}$/.test(academicYear.trim())) {
      setFormError("Academic year must be a 4-digit year like 2019 or 2020.");
      return false;
    }
    const numericYear = Number(academicYear.trim());
    if (numericYear < 1900 || numericYear > 2099) {
      setFormError("Academic year must be a valid year between 1900 and 2099.");
      return false;
    }
    return true;
  };

  const validateVideoFile = () => {
    if (!file) {
      setFormError("Please select a video file to upload.");
      return false;
    }

    const mimeType = file.type?.toLowerCase() || "";
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!mimeType.startsWith("video/") && !VIDEO_EXTENSIONS.includes(extension)) {
      setFormError("Only video files are allowed.");
      return false;
    }
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      setFormError(`Video file must be ${MAX_VIDEO_SIZE_MB}MB or smaller.`);
      return false;
    }
    return true;
  };

  const validateMetadata = () => {
    if (!title.trim()) {
      setFormError("Please enter a title.");
      return false;
    }
    if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
      setFormError(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`);
      return false;
    }
    if (!YEARS.includes(year)) {
      setFormError("Please select a valid year.");
      return false;
    }
    if (!SEMESTERS.includes(semester)) {
      setFormError("Please select a valid semester.");
      return false;
    }
    return validateAcademicYear();
  };

  const uploadVideo = async () => {
    if (!validateVideoFile() || !validateMetadata()) {
      return;
    }

    try {
      setFormError("");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("year", year);
      formData.append("semester", semester);
      formData.append("academicYear", academicYear.trim());

      await api.post("/api/videos/upload", formData, {
        withCredentials: true,
      });

      resetForm();
      fetchVideos();
    } catch (err) {
      console.error("Upload failed:", err);
      setFormError(errorMessage(err, "Upload failed. Please try again."));
    }
  };

  const deleteVideo = async (id) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;
    try {
      await api.delete(`/api/videos/${id}`, { withCredentials: true });
      fetchVideos();
    } catch (err) {
      console.error("Delete failed:", err);
      alert(errorMessage(err, "Delete failed. Please try again."));
    }
  };

  const startEdit = (video) => {
    setEditingVideoId(video.id);
    setTitle(video.title);
    setDescription(video.description || "");
    setYear(video.year);
    setSemester(video.semester);
    setAcademicYear(video.academicYear || "");
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    resetForm();
  };

  const updateVideo = async () => {
    if (!editingVideoId) return;
    if (!validateMetadata()) {
      return;
    }

    try {
      setFormError("");
      await api.put(
        `/api/videos/${editingVideoId}`,
        null,
        {
          params: {
            title: title.trim(),
            description: description.trim(),
            year,
            semester,
            academicYear: academicYear.trim(),
          },
          withCredentials: true,
        }
      );
      cancelEdit();
      fetchVideos();
    } catch (err) {
      console.error("Update failed:", err);
      setFormError(errorMessage(err, "Update failed. Please try again."));
    }
  };

  return (
    <div className="modern-home-page">
      <div className="light-bg-gradient" />
      <div className="grain-overlay" />
      <div className="color-ribbon color-ribbon-1" />
      <div className="color-ribbon color-ribbon-2" />
      <div className="color-ribbon color-ribbon-3" />
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <div className="glow-orb glow-orb-3" />

      <main className="site-shell pt-6 pb-8 min-h-screen flex flex-col gap-6 animate-in" style={{ animationDelay: "100ms" }}>
        <header className="premium-glass top-nav-shell rounded-full px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-lg shadow-[#5f3920]/20 transition-all duration-300">
              <img src={logo} alt="Uni Learn Hub logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight">
                Uni Learn Hub Admin
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest">
                Resource Control Center
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-2 lg:gap-3">
            {adminNavItems.map((item) => (
              <button
                key={item.label}
                className="nav-pill text-xs sm:text-sm"
                onClick={() => navigate(item.path)}
                type="button"
              >
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </header>

        <div className="premium-glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-2">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#b49060] to-[#876d47] flex items-center justify-center text-white shadow-md flex-shrink-0">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m-9 4h8a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[#2d2926]">Resources Management</h1>
              <p className="text-[#827a71] font-medium tracking-wide mt-1">Admin Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2.5 rounded-full bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:text-[#b49060] transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="premium-glass rounded-3xl p-6 sticky top-6">
              <h3 className="text-xl font-bold text-[#2d2926] mb-5 pb-3 border-b border-[#e8e4db] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#b49060]"></span>
                {editingVideoId ? "Edit Video" : "Upload New Video"}
              </h3>

              <div className="flex flex-col gap-4">
                {!editingVideoId && (
                  <div className="mb-2">
                    <label className="block text-xs font-bold text-[#827a71] uppercase tracking-wider mb-2">Video File</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        setFile(e.target.files?.[0] || null);
                        setFormError("");
                      }}
                      className="w-full text-sm text-[#5c544d] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#faf5eb] file:text-[#b49060] hover:file:bg-[#efeedd] transition-all cursor-pointer"
                    />
                    <p className="mt-2 text-xs text-[#827a71]">
                      Only video files are allowed for admin resources. Maximum file size: {MAX_VIDEO_SIZE_MB}MB.
                    </p>
                  </div>
                )}

                <input
                  placeholder="Title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setFormError("");
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm"
                />

                <textarea
                  placeholder="Description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setFormError("");
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm min-h-[100px] resize-y custom-scrollbar"
                />
                <p className="text-xs text-[#827a71] -mt-2">
                  Description must be at least {MIN_DESCRIPTION_LENGTH} characters. Current: {description.trim().length}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={year}
                    onChange={(e) => {
                      setYear(e.target.value);
                      setFormError("");
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm"
                  >
                    <option value="">Select year</option>
                    {YEARS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  <select
                    value={semester}
                    onChange={(e) => {
                      setSemester(e.target.value);
                      setFormError("");
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm"
                  >
                    <option value="">Select semester</option>
                    {SEMESTERS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <input
                  placeholder="Academic Year (e.g., 2019)"
                  value={academicYear}
                  maxLength={4}
                  inputMode="numeric"
                  pattern="\d{4}"
                  onChange={(e) => {
                    setAcademicYear(e.target.value.replace(/[^\d]/g, ""));
                    setFormError("");
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm"
                />
                <p className="text-xs text-[#827a71] -mt-2">
                  Academic year accepts numbers only and must be 4 digits.
                </p>

                {formError ? (
                  <div className="rounded-2xl border border-[#f0c3be] bg-[#fcf1ef] px-4 py-3 text-sm font-bold text-[#c36254]">
                    {formError}
                  </div>
                ) : null}

                <div className="flex gap-3 mt-2">
                  {editingVideoId ? (
                    <>
                      <button
                        onClick={updateVideo}
                        className="flex-1 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-md hover:-translate-y-0.5 transition-transform"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 px-4 py-2.5 rounded-full bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:bg-[#faf5eb] transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={uploadVideo}
                      className="w-full px-4 py-2.5 rounded-full bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-md hover:-translate-y-0.5 transition-transform flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Upload Video
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="premium-glass rounded-3xl p-6 min-h-[500px]">
              <h3 className="text-xl font-bold text-[#2d2926] mb-5 pb-3 border-b border-[#e8e4db] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#876d47]"></span>
                Uploaded Video Library
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {videos.map((video, idx) => (
                  <div
                    key={video.id}
                    className="bg-white/75 rounded-[28px] border border-white/80 shadow-[0_20px_60px_rgba(59,44,26,0.08)] p-4 md:p-5 flex flex-col gap-4 animate-in"
                    style={{ animationDelay: `${200 + (idx % 10) * 50}ms` }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#2d2926] line-clamp-2 text-lg" title={video.title}>{video.title}</h4>
                        <p className="text-sm text-[#827a71] mt-1">Academic year {video.academicYear || "Not set"}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#ebf5ed] text-[#6f917e] border border-[#d6eadc] text-[11px] font-bold tracking-[0.14em] uppercase">
                        Video
                      </span>
                    </div>

                    <p className="text-[#5c544d] text-sm min-h-[40px]">{video.description || "No description added."}</p>

                    <div className="rounded-2xl overflow-hidden border border-[#d6eadc] bg-black/5">
                      <video
                        className="w-full aspect-video object-cover"
                        controls
                        preload="metadata"
                      >
                        <source src={`${backendBase}/api/videos/stream/${video.id}`} type={video.contentType || "video/mp4"} />
                      </video>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      <span className="px-2.5 py-1 rounded-full bg-[#faf5eb] text-[#876d47] border border-[#e8e4db]">{video.year}</span>
                      <span className="px-2.5 py-1 rounded-full bg-[#faf5eb] text-[#876d47] border border-[#e8e4db]">{video.semester}</span>
                      <span className="px-2.5 py-1 rounded-full bg-white text-[#5c544d] border border-[#e8e4db]">{video.academicYear || "Not set"}</span>
                      <span className="px-2.5 py-1 rounded-full bg-white text-[#5c544d] border border-[#e8e4db]">{formatSize(video.fileSize)}</span>
                    </div>

                    <div className="mt-auto grid grid-cols-3 gap-2">
                      <button
                        onClick={() => startEdit(video)}
                        className="px-2 py-2 rounded-lg bg-[#f1efe9] text-[#5c544d] text-xs font-bold hover:bg-[#e8e4db] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteVideo(video.id)}
                        className="px-2 py-2 rounded-lg bg-[#fcf1ef] text-[#c36254] text-xs font-bold hover:bg-[#f0c3be] transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => navigate(`/createquiz/${video.id}`)}
                        className="px-2 py-2 rounded-lg bg-gradient-to-r from-[#b49060] to-[#876d47] text-white text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                      >
                        Quiz
                      </button>
                    </div>
                  </div>
                ))}

                {videos.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-white/40 rounded-2xl border border-[#e8e4db] backdrop-blur-sm">
                    <p className="text-[#827a71] font-medium">No videos uploaded yet. Use the form to add resources.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
