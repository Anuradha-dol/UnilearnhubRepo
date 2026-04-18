import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import logo from "../assets/logo.png";
import "../pages/Home.css";

const YEARS = ["FIRST", "SECOND", "THIRD", "FOURTH"];
const SEMESTERS = ["SEM1", "SEM2"];
const userNavItems = [
  { label: "Profile", path: "/profile" },
  { label: "Resources", path: "/resources" },
  { label: "Support", path: "/SupportUser" },
  { label: "Review", path: "/Review" },
  { label: "Tasks", path: "/taskPage" },
];

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

function errorMessage(err, fallback) {
  return err?.response?.data?.message || err?.response?.data || fallback;
}

function uniqueVideos(items) {
  const seen = new Map();
  for (const item of items || []) {
    if (!item) continue;
    const key = item.id ?? `${item.title}|${item.academicYear}|${item.year}|${item.semester}|${item.uploadedAt}|${item.fileSize}`;
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}

export default function LearningResources() {
  const navigate = useNavigate();
  const backendBase =
    api.defaults.baseURL || (typeof window !== "undefined" ? window.location.origin : "");
  const [videos, setVideos] = useState([]);
  const [filter, setFilter] = useState({ year: "", semester: "", title: "", academicYear: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [activeQuizSet, setActiveQuizSet] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [quizLoadingVideoId, setQuizLoadingVideoId] = useState(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizError, setQuizError] = useState("");

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await api.get("/api/videos/all", { withCredentials: true });
      setVideos(uniqueVideos(res.data));
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    }
  };

  const validateFilter = () => {
    if (filter.year && !YEARS.includes(filter.year)) {
      alert("Invalid year selected.");
      return false;
    }
    if (filter.semester && !SEMESTERS.includes(filter.semester)) {
      alert("Invalid semester selected.");
      return false;
    }
    if (filter.title && filter.title.length > 100) {
      alert("Title is too long.");
      return false;
    }
    if (filter.academicYear && !/^\d{4}$/.test(filter.academicYear)) {
      alert("Academic year must be a 4-digit year like 2019 or 2020.");
      return false;
    }
    return true;
  };

  const handleFilter = async () => {
    if (!validateFilter()) return;
    try {
      const hasAnyFilter = Boolean(
        filter.year || filter.semester || filter.title.trim() || filter.academicYear
      );
      if (!hasAnyFilter) {
        fetchVideos();
        return;
      }
      const res = await api.get("/api/videos/filter", {
        params: filter,
        withCredentials: true,
      });
      setVideos(uniqueVideos(res.data));
    } catch (err) {
      console.error("Filter failed:", err);
    }
  };

  const resetFilter = () => {
    setFilter({ year: "", semester: "", title: "", academicYear: "" });
    setSearchTerm("");
    fetchVideos();
  };

  const startQuiz = async (videoId) => {
    try {
      setQuizLoadingVideoId(videoId);
      setQuizError("");
      const res = await api.get(`/quizzes/${videoId}`, { withCredentials: true });
      const quizData = res.data || {};
      const questions = Array.isArray(quizData.questions) ? quizData.questions : [];

      if (questions.length === 0) {
        alert("No quiz questions are available for this video yet.");
        return;
      }

      setActiveVideoId(videoId);
      setActiveQuizSet(quizData.quizSet || "");
      setQuizQuestions(questions);
      setAnswers({});
      setResult(null);
    } catch (err) {
      const message = errorMessage(err, "Failed to load quiz.");
      setQuizError(message);
      alert(message);
    } finally {
      setQuizLoadingVideoId(null);
    }
  };

  const handleAnswerChange = (questionId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const submitQuiz = async () => {
    if (!activeVideoId || quizQuestions.length === 0) return;

    try {
      setQuizSubmitting(true);
      setQuizError("");
      const res = await api.post(
        `/quizzes/${activeVideoId}/submit`,
        { answers },
        { withCredentials: true }
      );
      setResult(res.data);
    } catch (err) {
      setQuizError(errorMessage(err, "Unable to submit this quiz."));
    } finally {
      setQuizSubmitting(false);
    }
  };

  const visibleVideos = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const normalizedVideos = uniqueVideos(videos);

    if (!query) {
      return normalizedVideos;
    }

    return normalizedVideos.filter((video) => {
      const searchableParts = [
        video.title,
        video.description,
        video.year,
        video.semester,
        video.academicYear,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      return searchableParts.some((value) => value.includes(query));
    });
  }, [searchTerm, videos]);

  const academicYearCount = useMemo(() => {
    return new Set(visibleVideos.map((video) => video.academicYear).filter(Boolean)).size;
  }, [visibleVideos]);

  const activeFilterCount = useMemo(() => {
    return [filter.year, filter.semester, filter.academicYear, filter.title.trim(), searchTerm.trim()]
      .filter(Boolean)
      .length;
  }, [filter, searchTerm]);

  const answeredCount = useMemo(() => {
    return quizQuestions.reduce((count, questionItem) => {
      return answers[questionItem.id] ? count + 1 : count;
    }, 0);
  }, [answers, quizQuestions]);

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

      <main className="site-shell pt-6 pb-8 min-h-screen flex flex-col gap-8 animate-in" style={{ animationDelay: "100ms" }}>
        <header className="premium-glass top-nav-shell rounded-full px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer" onClick={() => navigate("/home")}>
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-lg shadow-[#5f3920]/20 transition-all duration-300">
              <img src={logo} alt="Uni Learn Hub logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight">
                Uni Learn Hub
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest">
                Learning Resources
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-2 lg:gap-3">
            {userNavItems.map((item) => (
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

        <div className="premium-glass rounded-3xl p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
            <div>
              <h2 className="text-3xl font-extrabold text-[#2d2926] flex items-center gap-3 relative">
                <svg className="w-8 h-8 text-[#b49060]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m-9 4h8a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Instructor Resource Library
              </h2>
              <p className="text-[#5c544d] mt-2 max-w-2xl">
                Admin uploaded videos keep the current learning flow, now with academic year, size details, and the same richer visual style as the shared resource area.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/resources")}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-md hover:-translate-y-0.5 transition-transform"
              >
                Back to Shared Resources
              </button>
              <button
                onClick={() => navigate("/home")}
                className="px-5 py-2.5 rounded-full bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:text-[#b49060] transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="rounded-2xl border border-[#d6eadc] bg-[#f7fbf8] p-4">
              <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#6f917e]">Videos</p>
              <p className="text-3xl font-extrabold text-[#2d2926] mt-2">{visibleVideos.length}</p>
            </div>
            <div className="rounded-2xl border border-[#eadfca] bg-[#fffaf3] p-4">
              <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#876d47]">Academic Years</p>
              <p className="text-3xl font-extrabold text-[#2d2926] mt-2">{academicYearCount}</p>
            </div>
            <div className="rounded-2xl border border-[#e8e4db] bg-white/80 p-4">
              <p className="text-xs font-bold tracking-[0.16em] uppercase text-[#5c544d]">Active Filters</p>
              <p className="text-3xl font-extrabold text-[#2d2926] mt-2">{activeFilterCount}</p>
            </div>
          </div>

          <div className="bg-white/60 p-4 md:p-5 rounded-[28px] border border-[#e8e4db] shadow-[0_16px_40px_rgba(59,44,26,0.06)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#2d2926]">Filter Videos</h3>
                <p className="text-sm text-[#827a71]">Search with one field only or combine year, semester, academic year, and title together.</p>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-white border border-[#e8e4db] text-xs font-bold tracking-[0.14em] uppercase text-[#876d47] self-start">
                Optional Filters
              </span>
            </div>

            <label className="block bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(250,245,235,0.92))] rounded-[26px] border border-[#eadfca] px-5 py-4 shadow-sm mb-4">
              <span className="block text-[11px] font-bold tracking-[0.18em] uppercase text-[#876d47] mb-2">Quick Search</span>
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-[#faf5eb] border border-[#eadfca] flex items-center justify-center text-[#b49060] shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <input
                    placeholder="Type title, FIRST, SEM1, or 2019"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent text-[#2d2926] text-sm md:text-base font-medium placeholder-[#b0a79d] focus:outline-none"
                  />
                  <p className="text-xs text-[#8f8579] mt-1">This searches the visible videos instantly. Examples: `FIRST`, `SEM2`, `2019`, `database`.</p>
                </div>
              </div>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <label className="bg-white rounded-2xl border border-[#e8e4db] px-4 py-3 shadow-sm">
                <span className="block text-[11px] font-bold tracking-[0.16em] uppercase text-[#827a71] mb-2">Year</span>
                <select
                  value={filter.year}
                  onChange={(e) => setFilter({ ...filter, year: e.target.value })}
                  className="w-full bg-transparent text-[#2d2926] text-sm font-medium focus:outline-none"
                >
                  <option value="">Any year</option>
                  {YEARS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="bg-white rounded-2xl border border-[#e8e4db] px-4 py-3 shadow-sm">
                <span className="block text-[11px] font-bold tracking-[0.16em] uppercase text-[#827a71] mb-2">Semester</span>
                <select
                  value={filter.semester}
                  onChange={(e) => setFilter({ ...filter, semester: e.target.value })}
                  className="w-full bg-transparent text-[#2d2926] text-sm font-medium focus:outline-none"
                >
                  <option value="">Any semester</option>
                  {SEMESTERS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="bg-white rounded-2xl border border-[#e8e4db] px-4 py-3 shadow-sm">
                <span className="block text-[11px] font-bold tracking-[0.16em] uppercase text-[#827a71] mb-2">Academic Year</span>
                <input
                  placeholder="2019"
                  value={filter.academicYear}
                  maxLength={4}
                  onChange={(e) => setFilter({ ...filter, academicYear: e.target.value.replace(/[^\d]/g, "") })}
                  className="w-full bg-transparent text-[#2d2926] text-sm font-medium placeholder-[#b0a79d] focus:outline-none"
                />
              </label>

              <label className="bg-white rounded-2xl border border-[#e8e4db] px-4 py-3 shadow-sm">
                <span className="block text-[11px] font-bold tracking-[0.16em] uppercase text-[#827a71] mb-2">Title</span>
                <input
                  placeholder="Search title"
                  value={filter.title}
                  maxLength={100}
                  onChange={(e) => setFilter({ ...filter, title: e.target.value })}
                  className="w-full bg-transparent text-[#2d2926] text-sm font-medium placeholder-[#b0a79d] focus:outline-none"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={handleFilter}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-[0_4px_10px_rgba(180,144,96,0.3)] hover:-translate-y-0.5 transition-transform"
              >
                Apply Filters
              </button>
              <button
                onClick={resetFilter}
                className="px-6 py-2.5 rounded-full bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:bg-[#faf5eb] transition-colors"
              >
                Clear Filters
              </button>
              <p className="text-sm text-[#827a71]">Leave any field empty if you do not want to filter by it. Quick search also works alone.</p>
            </div>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[32px] border border-[#d6eadc] p-5 md:p-6 shadow-[0_28px_70px_rgba(54,39,20,0.08)] bg-[radial-gradient(circle_at_top_left,_rgba(111,145,126,0.18),_transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,250,246,0.92))]">
          <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-white/40 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl border border-[#d6eadc] flex items-center justify-center bg-[#ebf5ed] text-[#6f917e]">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m-9 4h8a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-[#2d2926]">Video Gallery</h4>
                  <p className="text-sm text-[#6b645d] mt-1 max-w-2xl">Browse admin videos by academic year, play them inline, and continue to the current quiz flow.</p>
                </div>
              </div>
              <span className="px-3.5 py-1.5 rounded-full border text-xs font-bold tracking-[0.16em] uppercase self-start bg-[#ebf5ed] text-[#6f917e] border-[#d6eadc]">
                {visibleVideos.length} item{visibleVideos.length === 1 ? "" : "s"}
              </span>
            </div>

            {visibleVideos.length === 0 ? (
              <div className="rounded-3xl border border-white/70 bg-white/70 p-6 text-center">
                <p className="font-semibold text-[#5c544d]">No instructor resources found in this view.</p>
                <p className="text-sm text-[#8e877f] mt-1">Adjust your filters or try a different search term.</p>
              </div>
            ) : (
              <div className="grid gap-5 grid-cols-1 xl:grid-cols-2">
                {visibleVideos.map((video) => (
                  <div key={video.id} className="bg-white/85 rounded-[28px] border border-white/80 shadow-[0_20px_60px_rgba(59,44,26,0.08)] p-4 md:p-5 flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h5 className="text-lg font-bold text-[#2d2926] line-clamp-2">{video.title}</h5>
                        <p className="text-sm text-[#827a71] mt-1">Uploaded {formatDate(video.uploadedAt)}</p>
                        <p className="text-sm text-[#827a71] mt-1">Academic year {video.academicYear || "Not set"}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full border text-[11px] font-bold tracking-[0.14em] uppercase bg-[#ebf5ed] text-[#6f917e] border-[#d6eadc]">
                        Video
                      </span>
                    </div>

                    <p className="text-sm text-[#5c544d] min-h-[40px]">{video.description || "No description added."}</p>

                    <div className="rounded-2xl overflow-hidden border border-[#d6eadc] bg-black/5">
                      <video
                        className="w-full aspect-video object-cover"
                        controls
                        preload="metadata"
                      >
                        <source src={`${backendBase}/api/videos/stream/${video.id}`} type={video.contentType || "video/mp4"} />
                        Your browser does not support the video tag.
                      </video>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      <span className="px-2.5 py-1 rounded-full bg-[#faf5eb] text-[#876d47] border border-[#e8e4db]">{video.year}</span>
                      <span className="px-2.5 py-1 rounded-full bg-[#faf5eb] text-[#876d47] border border-[#e8e4db]">{video.semester}</span>
                      <span className="px-2.5 py-1 rounded-full bg-white text-[#5c544d] border border-[#e8e4db]">Academic year {video.academicYear || "Not set"}</span>
                      <span className="px-2.5 py-1 rounded-full bg-white text-[#5c544d] border border-[#e8e4db]">{formatSize(video.fileSize)}</span>
                    </div>

                    <div className="mt-auto flex justify-between items-center border-t border-[#e8e4db] pt-4">
                      <button
                        onClick={() => startQuiz(video.id)}
                        disabled={quizLoadingVideoId === video.id}
                        className="w-full px-4 py-2.5 rounded-xl bg-white text-[#b49060] border border-[#e8e4db] font-bold text-sm shadow-sm hover:bg-[#b49060] hover:text-white hover:border-[#b49060] transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        {quizLoadingVideoId === video.id ? "Loading Quiz..." : "Take Assigned Quiz"}
                      </button>
                    </div>

                    {activeVideoId === video.id && quizQuestions.length > 0 && !result && (
                      <div className="mt-1 p-4 rounded-2xl bg-[#faf5eb] border border-[#e8e4db] animate-in" style={{ animationDelay: "0ms" }}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                          <div>
                            <h4 className="font-bold text-[#2d2926] flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#b49060]"></span>
                              Knowledge Check
                            </h4>
                            <p className="text-xs text-[#827a71] mt-1">
                              {activeQuizSet ? `Assigned set: ${activeQuizSet}` : "Your assigned quiz set"}
                            </p>
                          </div>
                          <div className="px-3 py-1.5 rounded-full bg-white border border-[#e8e4db] text-xs font-bold tracking-[0.14em] uppercase text-[#876d47] self-start">
                            {answeredCount} / {quizQuestions.length} answered
                          </div>
                        </div>

                        {quizError && (
                          <div className="mb-4 rounded-2xl border border-[#f3d3cd] bg-[#fcf1ef] px-4 py-3 text-sm text-[#b3473a]">
                            {quizError}
                          </div>
                        )}

                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                          {quizQuestions.map((q, qIndex) => (
                            <div key={q.id} className="bg-white p-3 rounded-xl border border-[#e8e4db] shadow-sm">
                              <p className="font-semibold text-[#2d2926] text-sm mb-2">{qIndex + 1}. {q.question}</p>
                              <div className="space-y-2">
                                {q.options.map((opt, index) => (
                                  <label key={index} className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-[#e8e4db]">
                                    <input
                                      type="radio"
                                      name={`question-${q.id}`}
                                      value={opt}
                                      checked={answers[q.id] === opt}
                                      onChange={() => handleAnswerChange(q.id, opt)}
                                      className="mt-0.5 text-[#b49060] focus:ring-[#b49060]"
                                    />
                                    <span className="text-[#5c544d] text-sm">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <p className="text-xs text-[#827a71]">
                            You can submit even if some questions are unanswered. Unanswered items are counted as skipped.
                          </p>
                          <button
                            onClick={submitQuiz}
                            disabled={quizSubmitting}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            {quizSubmitting ? "Submitting..." : "Submit Quiz"}
                          </button>
                        </div>
                      </div>
                    )}

                    {result && result.videoId === video.id && (
                      <div className="mt-1 p-4 rounded-2xl bg-white border border-[#e8e4db] shadow-sm animate-in" style={{ animationDelay: "0ms" }}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-[#e8e4db]">
                          <div>
                            <h4 className="font-bold text-[#2d2926]">Quiz Results</h4>
                            <p className="text-xs text-[#827a71] mt-1">
                              {result.quizSet ? `Quiz set: ${result.quizSet}` : "Assigned quiz result"}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${result.score === result.total ? "bg-[#ebf5ed] text-[#6f917e]" : result.score >= result.total / 2 ? "bg-[#faf5eb] text-[#b49060]" : "bg-[#fcf1ef] text-[#c36254]"}`}>
                            {result.score} / {result.total} Correct
                          </span>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                          {result.details.map((q, qIndex) => (
                            <div key={q.questionId} className="text-sm">
                              <p className="font-semibold text-[#2d2926] mb-1">{qIndex + 1}. {q.question}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[#827a71]">Your answer:</span>
                                <span className={q.correct ? "text-[#6f917e] font-medium" : "text-[#c36254] font-medium"}>
                                  {q.userAnswer || "Skipped"}
                                </span>
                                {q.correct ? (
                                  <svg className="w-4 h-4 text-[#6f917e]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                  <svg className="w-4 h-4 text-[#c36254]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                )}
                              </div>
                              {!q.correct && (
                                <div className="mt-1 text-[#6f917e] bg-[#ebf5ed]/50 inline-block px-2 py-0.5 rounded text-xs font-medium border border-[#ebf5ed]">
                                  Correct: {q.correctAnswer}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-[#e8e4db]">
                          <button
                            onClick={() => startQuiz(video.id)}
                            disabled={quizLoadingVideoId === video.id}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-[#876d47] border border-[#e8e4db] font-bold text-sm hover:bg-[#faf5eb] transition-colors"
                          >
                            Retry Assigned Quiz
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
