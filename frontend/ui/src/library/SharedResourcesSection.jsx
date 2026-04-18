import { useEffect, useState } from "react";
import api from "../api";

const YEARS = ["FIRST", "SECOND", "THIRD", "FOURTH"];
const SEMESTERS = ["SEM1", "SEM2"];
const TYPES = ["VIDEO", "PDF", "NOTE"];
const ALLOWED_EXTENSIONS = ["mp4", "mov", "avi", "mkv", "webm", "m4v", "pdf", "doc", "docx", "txt", "rtf", "md", "ppt", "pptx"];
const MIN_DESCRIPTION_LENGTH = 20;

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function resourceLabel(type) {
  if (type === "VIDEO") return "Video";
  if (type === "PDF") return "PDF";
  if (type === "NOTE") return "Notes";
  return "Resource";
}

function roleLabel(role) {
  return role ? role.replace("ROLE_", "") : "Member";
}

function errorMessage(err, fallback) {
  return err?.response?.data?.message || err?.response?.data || fallback;
}

function streamUrl(resourceId) {
  const baseUrl = api.defaults.baseURL || "";
  return `${baseUrl}/api/shared-resources/stream/${resourceId}`;
}

function fileExtension(name) {
  const value = name?.split(".").pop()?.trim();
  return value ? value.toUpperCase() : "FILE";
}

function sectionMeta(type) {
  if (type === "VIDEO") {
    return {
      title: "Video Gallery",
      subtitle: "Play shared lessons, walkthroughs, and recorded explainers.",
      shell: "border-[#d6eadc] bg-[radial-gradient(circle_at_top_left,_rgba(111,145,126,0.18),_transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,250,246,0.92))]",
      badge: "bg-[#ebf5ed] text-[#6f917e] border-[#d6eadc]",
      iconWrap: "bg-[#ebf5ed] text-[#6f917e] border-[#d6eadc]",
    };
  }
  if (type === "PDF") {
    return {
      title: "PDF Shelf",
      subtitle: "Keep structured guides, handouts, and reference packs together.",
      shell: "border-[#f3d3cd] bg-[radial-gradient(circle_at_top_left,_rgba(195,98,84,0.12),_transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(253,247,246,0.92))]",
      badge: "bg-[#fcf1ef] text-[#c36254] border-[#f3d3cd]",
      iconWrap: "bg-[#fcf1ef] text-[#c36254] border-[#f3d3cd]",
    };
  }
  return {
    title: "Notes Desk",
    subtitle: "Browse concise notes, study material, and quick revision files.",
    shell: "border-[#eadfca] bg-[radial-gradient(circle_at_top_left,_rgba(180,144,96,0.14),_transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(252,248,241,0.92))]",
    badge: "bg-[#faf5eb] text-[#876d47] border-[#eadfca]",
    iconWrap: "bg-[#faf5eb] text-[#876d47] border-[#eadfca]",
  };
}

function TypeIcon({ type, className = "w-6 h-6" }) {
  if (type === "VIDEO") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m-9 4h8a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
  }
  if (type === "PDF") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 3v5h5M8 14h8M8 18h6" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 13h6M9 17h4" />
    </svg>
  );
}

function ResourcePreview({ resource }) {
  const extension = fileExtension(resource.originalFileName);

  if (resource.resourceType === "VIDEO") {
    return (
      <div className="rounded-2xl overflow-hidden border border-[#d6eadc] bg-black/5">
        <video
          className="w-full aspect-video object-cover"
          controls
          preload="metadata"
          crossOrigin="use-credentials"
        >
          <source src={streamUrl(resource.id)} type={resource.contentType || "video/mp4"} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (resource.resourceType === "PDF") {
    return (
      <div className="rounded-2xl border border-[#f3d3cd] bg-gradient-to-br from-[#fff7f5] to-[#fffdfc] p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#fcf1ef] border border-[#f3d3cd] flex items-center justify-center text-[#c36254]">
            <TypeIcon type="PDF" className="w-6 h-6" />
          </div>
          <span className="px-2.5 py-1 rounded-full bg-white text-[#c36254] border border-[#f3d3cd] text-[10px] font-bold tracking-[0.16em]">
            {extension}
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2.5 w-4/5 rounded-full bg-[#f5ddd8]" />
          <div className="h-2.5 w-3/5 rounded-full bg-[#faebe7]" />
          <div className="h-2.5 w-2/3 rounded-full bg-[#f5ddd8]" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#c36254]">Portable document ready to download</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#eadfca] bg-gradient-to-br from-[#fffbf4] to-[#fffefb] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#faf5eb] border border-[#eadfca] flex items-center justify-center text-[#876d47]">
          <TypeIcon type="NOTE" className="w-6 h-6" />
        </div>
        <span className="px-2.5 py-1 rounded-full bg-white text-[#876d47] border border-[#eadfca] text-[10px] font-bold tracking-[0.16em]">
          {extension}
        </span>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2.5 w-4/5 rounded-full bg-[#f3ead8]" />
        <div className="h-2.5 w-2/3 rounded-full bg-[#fbf3e2]" />
        <div className="h-2.5 w-3/4 rounded-full bg-[#f3ead8]" />
        <div className="h-2.5 w-1/2 rounded-full bg-[#fbf3e2]" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#876d47]">Study notes and quick reference material</p>
    </div>
  );
}

function ResourceCard({ resource, onDownload, onDelete, canDelete }) {
  const meta = sectionMeta(resource.resourceType);

  return (
    <div className="bg-white/85 rounded-[28px] border border-white/80 shadow-[0_20px_60px_rgba(59,44,26,0.08)] p-4 md:p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h5 className="text-lg font-bold text-[#2d2926] line-clamp-2">{resource.title}</h5>
          <p className="text-sm text-[#827a71] mt-1">
            Uploaded by {resource.uploaderName} ({roleLabel(resource.uploaderRole)})
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full border text-[11px] font-bold tracking-[0.14em] uppercase ${meta.badge}`}>
          {resourceLabel(resource.resourceType)}
        </span>
      </div>

      <p className="text-sm text-[#5c544d] min-h-[40px]">{resource.description || "No description added."}</p>

      <ResourcePreview resource={resource} />

      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <span className="px-2.5 py-1 rounded-full bg-[#faf5eb] text-[#876d47] border border-[#e8e4db]">{resource.year}</span>
        <span className="px-2.5 py-1 rounded-full bg-[#faf5eb] text-[#876d47] border border-[#e8e4db]">{resource.semester}</span>
        <span className="px-2.5 py-1 rounded-full bg-white text-[#5c544d] border border-[#e8e4db]">{formatSize(resource.fileSize)}</span>
        <span className="px-2.5 py-1 rounded-full bg-white text-[#5c544d] border border-[#e8e4db]">{formatDate(resource.uploadedAt)}</span>
      </div>

      <div className="bg-[#faf5eb] border border-[#e8e4db] rounded-2xl px-4 py-3 text-sm text-[#5c544d] break-all">
        <span className="font-bold text-[#2d2926]">File:</span> {resource.originalFileName}
      </div>

      <div className="flex flex-wrap gap-3 mt-auto">
        <button
          onClick={() => onDownload(resource)}
          className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-sm hover:opacity-95 transition-opacity"
        >
          Download
        </button>
        {canDelete(resource) && (
          <button
            onClick={() => onDelete(resource.id)}
            className="px-4 py-2.5 rounded-xl bg-[#fcf1ef] text-[#c36254] border border-[#f3d3cd] font-bold text-sm hover:bg-[#f7e2de] transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function ResourceSection({ type, resources, onDownload, onDelete, canDelete, expanded, onToggle }) {
  const meta = sectionMeta(type);
  const previewCount = 2;
  const visibleResources = expanded ? resources : resources.slice(0, previewCount);
  const hiddenCount = Math.max(resources.length - previewCount, 0);

  return (
    <section className={`relative overflow-hidden rounded-[32px] border p-5 md:p-6 shadow-[0_28px_70px_rgba(54,39,20,0.08)] ${meta.shell}`}>
      <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-white/40 blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${meta.iconWrap}`}>
              <TypeIcon type={type} className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-xl font-extrabold text-[#2d2926]">{meta.title}</h4>
              <p className="text-sm text-[#6b645d] mt-1 max-w-2xl">{meta.subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3.5 py-1.5 rounded-full border text-xs font-bold tracking-[0.16em] uppercase self-start ${meta.badge}`}>
              {resources.length} item{resources.length === 1 ? "" : "s"}
            </span>
            {resources.length > previewCount && (
              <button
                onClick={onToggle}
                className="px-4 py-2 rounded-full bg-white/85 text-[#2d2926] border border-white/80 text-xs font-bold tracking-[0.12em] uppercase shadow-sm hover:bg-white transition-colors"
              >
                {expanded ? "Show less" : `See more${hiddenCount > 0 ? ` (${hiddenCount})` : ""}`}
              </button>
            )}
          </div>
        </div>

        {resources.length === 0 ? (
          <div className="rounded-3xl border border-white/70 bg-white/70 p-6 text-center">
            <p className="font-semibold text-[#5c544d]">No {resourceLabel(type).toLowerCase()} resources in this view.</p>
            <p className="text-sm text-[#8e877f] mt-1">Use the upload form or change the search filters above.</p>
          </div>
        ) : (
          <div>
            <div className={`grid gap-5 ${type === "VIDEO" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 lg:grid-cols-2"}`}>
              {visibleResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onDownload={onDownload}
                  onDelete={onDelete}
                  canDelete={canDelete}
                />
              ))}
            </div>

            {!expanded && resources.length > previewCount && (
              <div className="mt-5 flex items-center justify-center">
                <button
                  onClick={onToggle}
                  className="px-5 py-2.5 rounded-full bg-white/85 text-[#2d2926] border border-white/80 text-sm font-bold shadow-sm hover:bg-white transition-colors"
                >
                  See more {resourceLabel(type).toLowerCase()}
                </button>
              </div>
            )}

            {expanded && resources.length > previewCount && (
              <div className="mt-5 flex items-center justify-center">
                <button
                  onClick={onToggle}
                  className="px-5 py-2.5 rounded-full bg-white/75 text-[#5c544d] border border-white/80 text-sm font-bold shadow-sm hover:bg-white transition-colors"
                >
                  Show less
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default function SharedResourcesSection() {
  const [resources, setResources] = useState([]);
  const [filters, setFilters] = useState({ year: "", semester: "", title: "", resourceType: "" });
  const [form, setForm] = useState({ title: "", description: "", year: "", semester: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    VIDEO: false,
    PDF: false,
    NOTE: false,
  });

  useEffect(() => {
    fetchCurrentUser();
    fetchResources();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/user/me", { withCredentials: true });
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Failed to load current user:", err);
    }
  };

  const fetchResources = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const hasFilters = Boolean(
        nextFilters.year || nextFilters.semester || nextFilters.title.trim() || nextFilters.resourceType
      );
      const res = await api.get(
        hasFilters ? "/api/shared-resources/filter" : "/api/shared-resources/all",
        {
          params: hasFilters ? nextFilters : undefined,
          withCredentials: true,
        }
      );
      setResources(res.data);
    } catch (err) {
      console.error("Failed to load shared resources:", err);
    } finally {
      setLoading(false);
    }
  };

  const validateUpload = () => {
    if (!selectedFile) {
      setUploadError("Please select a file to share.");
      return false;
    }
    const extension = selectedFile.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setUploadError("Only video, PDF, and note files are supported.");
      return false;
    }
    if (!form.title.trim()) {
      setUploadError("Please enter a title.");
      return false;
    }
    if (form.description.trim().length < MIN_DESCRIPTION_LENGTH) {
      setUploadError(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters.`);
      return false;
    }
    if (!YEARS.includes(form.year)) {
      setUploadError("Please select a valid year.");
      return false;
    }
    if (!SEMESTERS.includes(form.semester)) {
      setUploadError("Please select a valid semester.");
      return false;
    }
    return true;
  };

  const uploadResource = async () => {
    if (!validateUpload()) return;

    setUploading(true);
    try {
      setUploadError("");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("year", form.year);
      formData.append("semester", form.semester);

      await api.post("/api/shared-resources/upload", formData, {
        withCredentials: true,
      });

      setForm({ title: "", description: "", year: "", semester: "" });
      setSelectedFile(null);
      setFileInputKey((current) => current + 1);
      await fetchResources(filters);
      alert("Resource shared successfully.");
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError(errorMessage(err, "Upload failed. Please try again."));
    } finally {
      setUploading(false);
    }
  };

  const searchResources = async () => {
    if (filters.year && !YEARS.includes(filters.year)) {
      alert("Invalid year selected.");
      return;
    }
    if (filters.semester && !SEMESTERS.includes(filters.semester)) {
      alert("Invalid semester selected.");
      return;
    }
    if (filters.resourceType && !TYPES.includes(filters.resourceType)) {
      alert("Invalid resource type selected.");
      return;
    }
    await fetchResources(filters);
  };

  const resetFilters = async () => {
    const emptyFilters = { year: "", semester: "", title: "", resourceType: "" };
    setFilters(emptyFilters);
    await fetchResources(emptyFilters);
  };

  const downloadResource = async (resource) => {
    try {
      const res = await api.get(`/api/shared-resources/download/${resource.id}`, {
        responseType: "blob",
        withCredentials: true,
      });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = resource.originalFileName || `${resource.title}.file`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      alert(errorMessage(err, "Download failed. Please try again."));
    }
  };

  const deleteResource = async (resourceId) => {
    if (!window.confirm("Delete this shared resource?")) return;

    try {
      await api.delete(`/api/shared-resources/${resourceId}`, { withCredentials: true });
      await fetchResources(filters);
    } catch (err) {
      console.error("Delete failed:", err);
      alert(errorMessage(err, "Delete failed. Please try again."));
    }
  };

  const canDelete = (resource) => {
    if (!currentUser) return false;
    return currentUser.id === resource.uploadedBy || currentUser.role === "ROLE_ADMIN";
  };

  const toggleSection = (type) => {
    setExpandedSections((current) => ({
      ...current,
      [type]: !current[type],
    }));
  };

  const videoResources = resources.filter((resource) => resource.resourceType === "VIDEO");
  const pdfResources = resources.filter((resource) => resource.resourceType === "PDF");
  const noteResources = resources.filter((resource) => resource.resourceType === "NOTE");

  return (
    <div className="premium-glass rounded-3xl p-6 md:p-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
        <div>
          <h3 className="text-2xl font-extrabold text-[#2d2926]">Community Shared Resources</h3>
          <p className="text-[#5c544d] mt-2 max-w-2xl">
            Videos, PDFs, and notes are arranged in separate spaces now, while the current upload and download flow stays the same.
          </p>
        </div>
        <div className="px-4 py-3 rounded-2xl bg-white/60 border border-[#e8e4db] text-sm text-[#5c544d] min-w-[260px]">
          <p className="font-bold text-[#2d2926] mb-1">Accepted files</p>
          <p>Video: MP4, MOV, AVI, MKV, WEBM</p>
          <p>Documents: PDF, DOC, DOCX, TXT, RTF, MD, PPT, PPTX</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
        <div className="bg-white/55 rounded-3xl border border-[#e8e4db] p-5 shadow-sm">
          <h4 className="text-lg font-bold text-[#2d2926] mb-4">Share Your Resource</h4>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-[#827a71] uppercase tracking-wider mb-2">File</label>
              <input
                key={fileInputKey}
                type="file"
                onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] || null);
                  setUploadError("");
                }}
                className="w-full text-sm text-[#5c544d] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#faf5eb] file:text-[#b49060] hover:file:bg-[#efeedd] transition-all cursor-pointer"
              />
            </div>

            <input
              placeholder="Resource title"
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value });
                setUploadError("");
              }}
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm"
            />

            <textarea
              placeholder="Short description"
              value={form.description}
              onChange={(e) => {
                setForm({ ...form, description: e.target.value });
                setUploadError("");
              }}
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm min-h-[110px] resize-y custom-scrollbar"
            />
            <p className="text-xs text-[#827a71] -mt-2">
              Description must be at least {MIN_DESCRIPTION_LENGTH} characters. Current: {form.description.trim().length}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.year}
                onChange={(e) => {
                  setForm({ ...form, year: e.target.value });
                  setUploadError("");
                }}
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm"
              >
                <option value="">Select year</option>
                {YEARS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              <select
                value={form.semester}
                onChange={(e) => {
                  setForm({ ...form, semester: e.target.value });
                  setUploadError("");
                }}
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm"
              >
                <option value="">Select semester</option>
                {SEMESTERS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            {uploadError ? (
              <div className="rounded-2xl border border-[#f0c3be] bg-[#fcf1ef] px-4 py-3 text-sm font-bold text-[#c36254]">
                {uploadError}
              </div>
            ) : null}

            <button
              onClick={uploadResource}
              disabled={uploading}
              className="w-full px-4 py-3 rounded-full bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-md hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {uploading ? "Sharing..." : "Share Resource"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/55 rounded-3xl border border-[#e8e4db] p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h4 className="text-lg font-bold text-[#2d2926]">Shared by Users</h4>
                <span className="text-sm text-[#827a71]">{resources.length} resource{resources.length === 1 ? "" : "s"} in this view</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-[#d6eadc] bg-[#f7fbf8] p-4">
                  <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#6f917e]">Videos</p>
                  <p className="text-3xl font-extrabold text-[#2d2926] mt-2">{videoResources.length}</p>
                </div>
                <div className="rounded-2xl border border-[#f3d3cd] bg-[#fff8f7] p-4">
                  <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#c36254]">PDFs</p>
                  <p className="text-3xl font-extrabold text-[#2d2926] mt-2">{pdfResources.length}</p>
                </div>
                <div className="rounded-2xl border border-[#eadfca] bg-[#fffaf3] p-4">
                  <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#876d47]">Notes</p>
                  <p className="text-3xl font-extrabold text-[#2d2926] mt-2">{noteResources.length}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 bg-white/70 p-4 rounded-2xl border border-[#e8e4db]">
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  className="px-4 py-2.5 rounded-full bg-white border border-[#e8e4db] text-[#5c544d] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm"
                >
                  <option value="">All Years</option>
                  {YEARS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>

                <select
                  value={filters.semester}
                  onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                  className="px-4 py-2.5 rounded-full bg-white border border-[#e8e4db] text-[#5c544d] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm"
                >
                  <option value="">All Semesters</option>
                  {SEMESTERS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>

                <select
                  value={filters.resourceType}
                  onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
                  className="px-4 py-2.5 rounded-full bg-white border border-[#e8e4db] text-[#5c544d] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm"
                >
                  <option value="">All Types</option>
                  {TYPES.map((item) => (
                    <option key={item} value={item}>{resourceLabel(item)}</option>
                  ))}
                </select>

                <input
                  placeholder="Search shared resources..."
                  value={filters.title}
                  maxLength={100}
                  onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                  className="flex-1 min-w-[220px] px-4 py-2.5 rounded-full bg-white border border-[#e8e4db] text-[#2d2926] text-sm font-medium placeholder-[#a39c93] focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-sm"
                />

                <div className="flex gap-2">
                  <button
                    onClick={searchResources}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-sm hover:-translate-y-0.5 transition-transform"
                  >
                    Search
                  </button>
                  <button
                    onClick={resetFilters}
                    className="px-6 py-2.5 rounded-full bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:bg-[#faf5eb] transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-[#e8e4db] bg-white/60 p-12 text-center text-[#827a71]">
              Loading shared resources...
            </div>
          ) : (
            <div className="space-y-6">
              <ResourceSection
                type="VIDEO"
                resources={videoResources}
                onDownload={downloadResource}
                onDelete={deleteResource}
                canDelete={canDelete}
                expanded={expandedSections.VIDEO}
                onToggle={() => toggleSection("VIDEO")}
              />
              <ResourceSection
                type="PDF"
                resources={pdfResources}
                onDownload={downloadResource}
                onDelete={deleteResource}
                canDelete={canDelete}
                expanded={expandedSections.PDF}
                onToggle={() => toggleSection("PDF")}
              />
              <ResourceSection
                type="NOTE"
                resources={noteResources}
                onDownload={downloadResource}
                onDelete={deleteResource}
                canDelete={canDelete}
                expanded={expandedSections.NOTE}
                onToggle={() => toggleSection("NOTE")}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
