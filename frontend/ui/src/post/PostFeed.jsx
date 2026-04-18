import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import PostCard from "./PostCard";
import NotificationsWidget from "./NotificationsWidget";
import MentionComposerTextarea from "./MentionComposerTextarea";
import SavedCollectionsPanel from "./SavedCollectionsPanel";
import { fetchPostCollections, fetchSavedPostIds, fetchSavedPosts } from "./savedPostsApi";

const learningPreferenceOptions = [
  { value: "BACKEND", label: "Backend Development" },
  { value: "FRONTEND", label: "Frontend Development" },
  { value: "FULLSTACK", label: "Full Stack Development" },
  { value: "DATA_SCIENCE", label: "Data Science" },
];

const PostFeed = () => {
  const [posts, setPosts] = useState([]);
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [newLearningPreference, setNewLearningPreference] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [imageRenderVersion, setImageRenderVersion] = useState(0);
  const [activeMenu, setActiveMenu] = useState(null);
  const [creating, setCreating] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [highlightedSourcePostId, setHighlightedSourcePostId] = useState(null);
  const [savedPostIds, setSavedPostIds] = useState([]);
  const [collections, setCollections] = useState([]);
  const [savedMode, setSavedMode] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [activeHashtag, setActiveHashtag] = useState("");
  const backendBase = api.defaults.baseURL || "http://localhost:8081";
  const MAX_CONTENT_LENGTH = 2000;
  const MAX_IMAGE_SIZE_MB = 5;
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const location = useLocation();
  const navigate = useNavigate();
  const fetchInFlightRef = useRef(false);

  const getErrorMessage = (err, fallback) => {
    const data = err?.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object" && typeof data.message === "string") return data.message;
    if (typeof err?.message === "string" && err.message.trim()) return err.message;
    return fallback;
  };

  const loadSavedIds = useCallback(async () => {
    try {
      const ids = await fetchSavedPostIds();
      setSavedPostIds(ids);
    } catch {
      setSavedPostIds([]);
    }
  }, []);

  const loadCollections = useCallback(async () => {
    try {
      const data = await fetchPostCollections();
      setCollections(data);
    } catch {
      setCollections([]);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      if (savedMode) {
        const data = await fetchSavedPosts({ collectionId: activeCollectionId, limit: 50 });
        setPosts(data || []);
        return;
      }

      const res = await api.get("/shares/feed", {
        withCredentials: true,
        params: {
          limit: 50,
          ...(activeHashtag ? { tag: activeHashtag } : {}),
        },
        timeout: 20000,
      });
      setPosts(res.data || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  }, [savedMode, activeCollectionId, activeHashtag]);

  const refreshFeed = useCallback(async () => {
    if (fetchInFlightRef.current) {
      return;
    }

    fetchInFlightRef.current = true;
    try {
      await fetchPosts();
    } finally {
      fetchInFlightRef.current = false;
    }
  }, [fetchPosts]);

  const validatePostForm = (content, image, learningPreference) => {
    const errors = {};
    const trimmedContent = content.trim();

    if (!trimmedContent && !image) {
      errors.form = "Please add text or attach an image before posting.";
    }

    if (!learningPreference) {
      errors.learningPreference = "Please select a learning preference for this post.";
    }

    if (trimmedContent.length > MAX_CONTENT_LENGTH) {
      errors.content = `Post text cannot exceed ${MAX_CONTENT_LENGTH} characters.`;
    }

    if (image) {
      if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
        errors.image = "Only JPG, PNG, WEBP, or GIF images are allowed.";
      }
      const maxBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
      if (image.size > maxBytes) {
        errors.image = `Image size must be less than ${MAX_IMAGE_SIZE_MB}MB.`;
      }
    }

    return errors;
  };

  const handleCreatePost = async () => {
    try {
      const validationErrors = validatePostForm(newContent, newImage, newLearningPreference);
      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        return;
      }

      setFormErrors({});
      setCreating(true);
      const formData = new FormData();
      formData.append("content", newContent);
      if (newImage) formData.append("image", newImage);
      formData.append("learningPreference", newLearningPreference);

      const res = await api.post("/posts/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setPosts((prev) => [
        { ...res.data, type: "POST", shareCount: 0 },
        ...prev,
      ]);
      await Promise.all([refreshFeed(), loadSavedIds(), loadCollections()]);
      setNewContent("");
      setNewImage(null);
      setNewLearningPreference("");
      setFormErrors({});
    } catch (err) {
      console.error("Error creating post:", err);
      alert(getErrorMessage(err, "Failed to create post. Try again."));
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/delete/${postId}`, { withCredentials: true });
      setPosts((prev) => prev.filter((p) => p.postId !== postId));
      setActiveMenu(null);
    } catch (err) {
      console.error("Error deleting post:", err);
      if (err.response?.status === 403) alert("You are not authorized to delete this post.");
      else alert("Failed to delete post. Try again.");
    }
  };

  const handleDeleteShare = async (shareId) => {
    try {
      await api.delete(`/shares/${shareId}`, { withCredentials: true });
      setPosts((prev) => prev.filter((p) => p.postId !== shareId));
      setActiveMenu(null);
      await refreshFeed();
    } catch (err) {
      console.error("Error deleting share:", err);
      if (err.response?.status === 403) alert("You are not authorized to delete this share.");
      else alert("Failed to delete share. Try again.");
    }
  };

  useEffect(() => {
    refreshFeed();
  }, [refreshFeed]);

  useEffect(() => {
    loadSavedIds();
    loadCollections();
  }, [loadSavedIds, loadCollections]);

  const handleSaveStateChanged = useCallback(async () => {
    await Promise.all([loadSavedIds(), loadCollections()]);
    if (savedMode) {
      await refreshFeed();
    }
  }, [loadSavedIds, loadCollections, savedMode, refreshFeed]);

  const handleHashtagClick = useCallback((token) => {
    const normalized = String(token || "").replace(/^#/, "").trim();
    if (!normalized) {
      return;
    }

    setSavedMode(false);
    setActiveCollectionId(null);
    setActiveHashtag(normalized);
  }, []);

  const handleShareCreated = useCallback(async () => {
    await refreshFeed();
  }, [refreshFeed]);

  useEffect(() => {
    const pollMs = savedMode ? 45000 : 15000;

    const refreshIfVisible = async () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      await refreshFeed();
    };

    const intervalId = window.setInterval(() => {
      refreshIfVisible();
    }, pollMs);

    window.addEventListener("focus", refreshIfVisible);
    window.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfVisible);
      window.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [refreshFeed, savedMode]);

  useEffect(() => {
    if (!previewImage) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setPreviewImage(null);
        setImageRenderVersion((prev) => prev + 1);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [previewImage]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetPostId = params.get("postId");
    if (!targetPostId || posts.length === 0) return;

    const matched = posts.some((post) => {
      const sourceId = post.type === "SHARE" || Boolean(post.originalPostId)
          ? post.originalPostId
          : post.postId;
      return String(sourceId) === String(targetPostId);
    });

    if (!matched) return;

    setHighlightedSourcePostId(String(targetPostId));

    const el = document.querySelector(`[data-source-post-id="${targetPostId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const timer = window.setTimeout(() => {
      setHighlightedSourcePostId(null);
    }, 2200);

    navigate("/home", { replace: true });

    return () => window.clearTimeout(timer);
  }, [location.search, posts, navigate]);

  const closePreview = () => {
    setPreviewImage(null);
    setImageRenderVersion((prev) => prev + 1);
  };

  const previewModal =
      previewImage && typeof document !== "undefined"
          ? createPortal(
              <div
                  className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#2d2926]/92 p-4"
                  onClick={closePreview}
              >
                <div className="relative w-full max-w-6xl flex justify-center" onClick={(event) => event.stopPropagation()}>
                  <a
                      href={previewImage}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute -top-12 left-0 chip-btn px-4 py-2 bg-white text-[#2d2926] rounded-full hover:bg-[#fcfbf9] shadow-lg border border-[#e8e4db] font-bold"
                  >
                    Open Original
                  </a>
                  <button
                      type="button"
                      className="absolute -top-12 right-0 chip-btn px-4 py-2 bg-white text-[#2d2926] rounded-full hover:bg-[#fcfbf9] shadow-lg border border-[#e8e4db] font-bold"
                      onClick={closePreview}
                  >
                    Close Preview
                  </button>
                  <img
                      src={previewImage}
                      alt="full preview"
                      className="post-image-safe max-h-[85vh] w-auto max-w-full rounded-2xl border border-white bg-white shadow-2xl object-contain"
                      style={{ filter: "none" }}
                      decoding="async"
                  />
                </div>
              </div>,
              document.body
          )
          : null;

  return (
      <div className="relative py-3">
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_14%_12%,rgba(180,144,96,0.16),transparent_36%),radial-gradient(circle_at_86%_88%,rgba(130,122,113,0.14),transparent_34%),linear-gradient(160deg,rgba(252,248,242,0.95),rgba(245,236,222,0.78))]" />
        <div className="mx-auto w-full">
          <div className="mb-8 rounded-3xl border border-[#e8e4db] bg-[linear-gradient(155deg,rgba(255,255,255,0.88),rgba(249,241,228,0.9))] p-6 shadow-[0_16px_34px_-16px_rgba(45,41,38,0.32)] backdrop-blur-xl transition hover:shadow-[0_22px_40px_-18px_rgba(45,41,38,0.38)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-[#2d2926] flex items-center gap-2">
                <svg className="w-6 h-6 text-[#b49060]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Create Post
              </h2>
              <div className="flex items-center gap-2">
                <NotificationsWidget enableStream={false} onNotificationClick={(item) => {
                  if (item?.postId) {
                    navigate(`/home?postId=${item.postId}`);
                  }
                }} />
                <span className="rounded-full border border-[#e8e4db] bg-[#f1efe9] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#b49060] shadow-sm">
                Live Feed
              </span>
              </div>
            </div>

            <div className="mb-4">
              <SavedCollectionsPanel
                  savedMode={savedMode}
                  collections={collections}
                  activeCollectionId={activeCollectionId}
                  activeHashtag={activeHashtag}
                  onToggleSavedMode={(enabled) => {
                    setSavedMode(enabled);
                    if (!enabled) {
                      setActiveCollectionId(null);
                    }
                    setActiveHashtag("");
                  }}
                  onSelectCollection={setActiveCollectionId}
                  onClearHashtag={() => setActiveHashtag("")}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#827a71]">
                  Learning Preference
                </label>
                <select
                    value={newLearningPreference}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewLearningPreference(value);
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        if (value) delete next.learningPreference;
                        return next;
                      });
                    }}
                    className="w-full rounded-xl border border-[#e8e4db] bg-[#fefcf8]/90 px-3 py-2 text-sm text-[#2d2926] outline-none transition focus:border-[#b49060] focus:bg-white focus:ring-2 focus:ring-[#b49060]/20"
                >
                  <option value="">Select learning preference</option>
                  {learningPreferenceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                  ))}
                </select>
                {formErrors.learningPreference && (
                    <p className="mt-1 text-xs font-medium text-[#c36254]">{formErrors.learningPreference}</p>
                )}
              </div>

              <MentionComposerTextarea
                  placeholder="What academic topic or question is on your mind? Use @name and #tags"
                  value={newContent}
                  onChange={(value) => {
                    setNewContent(value);
                    setFormErrors((prev) => {
                      const next = { ...prev };
                      if (value.trim().length <= MAX_CONTENT_LENGTH) delete next.content;
                      if (value.trim() || newImage) delete next.form;
                      return next;
                    });
                  }}
                  className="h-28 w-full resize-none rounded-2xl border border-[#e8e4db] bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(250,244,234,0.85))] px-4 py-4 text-sm text-[#2d2926] outline-none transition-all focus:border-[#b49060] focus:bg-white focus:ring-2 focus:ring-[#b49060]/20 placeholder:text-[#a39c93] shadow-inner"
                  maxLength={MAX_CONTENT_LENGTH}
              />
              <div className="flex items-center justify-between px-1">
                <p className={`text-xs font-semibold ${newContent.length > MAX_CONTENT_LENGTH ? "text-[#c36254]" : "text-[#a39c93]"}`}>
                  {newContent.length} <span className="text-[#a39c93]">/ {MAX_CONTENT_LENGTH}</span>
                </p>
                {formErrors.content && <p className="text-xs font-medium text-[#c36254]">{formErrors.content}</p>}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#b49060]/60 bg-[#faf5eb]/80 px-4 py-2 text-sm font-bold text-[#b49060] transition hover:bg-[#efeedd] shadow-sm">
                  <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setNewImage(file);
                        setFormErrors((prev) => {
                          const next = { ...prev };
                          if (file) {
                            delete next.form;
                            delete next.image;
                          }
                          return next;
                        });
                      }}
                  />
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{newImage ? "Change Image" : "Attach Image"}</span>
                </label>

                {newImage && (
                    <span className="max-w-xs truncate text-xs font-bold text-[#876d47] bg-[#f1efe9] px-3 py-1.5 rounded-lg border border-[#e8e4db] shadow-sm">
                  {newImage.name}
                </span>
                )}

                <button
                    onClick={handleCreatePost}
                    disabled={creating}
                    className="chip-btn px-6 py-2.5 rounded-full bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-md shadow-[#b49060]/20 hover:shadow-lg hover:shadow-[#b49060]/30 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ml-auto"
                >
                  {creating ? "Publishing..." : "Publish Post"}
                </button>
              </div>
              {formErrors.image && <p className="text-xs font-medium text-[#c36254] mt-2">{formErrors.image}</p>}
              {formErrors.form && <p className="text-sm font-medium text-[#c36254] mt-2 bg-[#fcf1ef] px-3 py-2 rounded-lg border border-[#f0c3be]">{formErrors.form}</p>}
            </div>
          </div>

          <div className="space-y-6">
            {posts.map((post) => (
                <PostCard
                    key={(post.type === "SHARE" || Boolean(post.originalPostId)) ? `share-${post.postId}` : `post-${post.postId}`}
                    post={post}
                    backendBase={backendBase}
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    onDeletePost={handleDeletePost}
                    onDeleteShare={handleDeleteShare}
                    onPreviewImage={setPreviewImage}
                    imageRenderVersion={imageRenderVersion}
                    highlightedSourcePostId={highlightedSourcePostId}
                    api={api}
                    savedPostIds={savedPostIds}
                    onSaveStateChanged={handleSaveStateChanged}
                    onShareSuccess={handleShareCreated}
                    onHashtagClick={handleHashtagClick}
                />
            ))}

            {posts.length === 0 && (
                <div className="rounded-3xl border border-dashed border-[#d9ccb8] bg-[linear-gradient(160deg,rgba(255,255,255,0.8),rgba(245,236,222,0.76))] p-12 text-center backdrop-blur-md">
                  <div className="w-16 h-16 rounded-full bg-[#f1efe9] border border-[#e8e4db] flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#a39c93]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-[#2d2926] text-lg font-bold">It's quiet here...</p>
                  <p className="text-[#827a71] text-sm mt-1 font-medium">Be the first to share your thoughts with the community.</p>
                </div>
            )}
          </div>

          {previewModal}
        </div>
      </div>
  );
};

export default PostFeed;
