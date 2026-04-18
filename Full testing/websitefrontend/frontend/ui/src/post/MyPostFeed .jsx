import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../api";
import PostCard from "./PostCard";
import NotificationsWidget from "./NotificationsWidget";
import MentionComposerTextarea from "./MentionComposerTextarea";
import { fetchSavedPostIds } from "./savedPostsApi";
import "./MyPostFeed.css";

const learningPreferenceOptions = [
  { value: "BACKEND", label: "Backend Development" },
  { value: "FRONTEND", label: "Frontend Development" },
  { value: "FULLSTACK", label: "Full Stack Development" },
  { value: "DATA_SCIENCE", label: "Data Science" },
];

const MyPostFeed = () => {
  const MY_POST_FETCH_LIMIT = 30;
  const [posts, setPosts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [feedWarning, setFeedWarning] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [newLearningPreference, setNewLearningPreference] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [imageRenderVersion, setImageRenderVersion] = useState(0);
  const [activeMenu, setActiveMenu] = useState(null);
  const [savedPostIds, setSavedPostIds] = useState([]);

  const backendBase = api.defaults.baseURL || "http://localhost:8081";

  const normalizeFeedItem = (item) => {
    const isShare = Boolean(item.originalPostId);

    if (!isShare) {
      return {
        ...item,
        type: "POST",
        shareCount: Number(item.shareCount || 0),
      };
    }

    return {
      ...item,
      type: "SHARE",
      postId: item.shareId || item.postId,
      originalPostId: item.originalPostId,
      content: item.originalContent || item.content,
      authorName: item.originalAuthorName || item.authorName,
      imageUrl: item.originalImageUrl || item.imageUrl,
      shareCaption: item.shareCaption || item.caption || "",
      sharedByName: item.sharedByName || item.authorName,
      sharedAt: item.sharedAt || item.createdAt,
      learningPreference: item.originalLearningPreference || item.learningPreference,
      shareCount: Number(item.shareCount || 0),
    };
  };

  const refreshMyPosts = useCallback(async () => {
    const requestConfig = {
      params: { limit: MY_POST_FETCH_LIMIT },
      timeout: 15000,
    };

    let myPosts = [];
    let myShares = [];
    let hadPartialFailure = false;
    let lastError = null;

    try {
      const postsRes = await api.get("/posts/my", requestConfig);
      myPosts = (postsRes.data || []).map(normalizeFeedItem);
    } catch (err) {
      hadPartialFailure = true;
      lastError = err;
      console.warn("Failed loading /posts/my", err);
    }

    try {
      const sharesRes = await api.get("/shares/my", requestConfig);
      myShares = (sharesRes.data || []).map(normalizeFeedItem);
    } catch (err) {
      hadPartialFailure = true;
      lastError = err;
      console.warn("Failed loading /shares/my", err);
    }

    if (myPosts.length === 0 && myShares.length === 0 && lastError) {
      throw lastError;
    }

    const merged = [...myPosts, ...myShares].sort(
        (a, b) => new Date(b.createdAt || b.sharedAt) - new Date(a.createdAt || a.sharedAt)
    );

    setFeedWarning(hadPartialFailure ? "Some post items could not be loaded right now." : "");
    setPosts(merged);
  }, [MY_POST_FETCH_LIMIT]);

  const loadSavedIds = useCallback(async () => {
    try {
      const ids = await fetchSavedPostIds();
      setSavedPostIds(ids);
    } catch {
      setSavedPostIds([]);
    }
  }, []);

  const handleShareCreated = useCallback(async () => {
    await Promise.all([refreshMyPosts(), loadSavedIds()]);
  }, [refreshMyPosts, loadSavedIds]);

  useEffect(() => {
    setVisibleCount(12);
  }, [posts.length]);

  const handleCreatePost = async () => {
    if (!newContent.trim() && !newImage) return;
    if (!newLearningPreference) {
      alert("Please select a learning preference for this post.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("content", newContent);
      if (newImage) formData.append("image", newImage);
      formData.append("learningPreference", newLearningPreference);

      const res = await api.post("/posts/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPosts((prev) => [normalizeFeedItem(res.data), ...prev]);
      await Promise.all([refreshMyPosts(), loadSavedIds()]);
      setNewContent("");
      setNewImage(null);
      setNewLearningPreference("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/delete/${postId}`);
      setPosts((prev) => prev.filter((p) => p.postId !== postId));
      await Promise.all([refreshMyPosts(), loadSavedIds()]);
      setActiveMenu(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteShare = async (shareId) => {
    try {
      await api.delete(`/shares/${shareId}`);
      setPosts((prev) => prev.filter((p) => p.postId !== shareId));
      await Promise.all([refreshMyPosts(), loadSavedIds()]);
      setActiveMenu(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete share");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadMyPosts = async () => {
      try {
        if (!cancelled) {
          setLoadingFeed(true);
          setFeedWarning("");
        }

        await refreshMyPosts();
      } catch (err) {
        console.error("Failed to load my post feed", err);
        if (!cancelled) {
          setFeedWarning("Unable to load your posts right now. Please retry in a moment.");
        }
      } finally {
        if (!cancelled) {
          setLoadingFeed(false);
        }
      }
    };

    loadMyPosts();
    loadSavedIds();

    return () => {
      cancelled = true;
    };
  }, [refreshMyPosts, loadSavedIds]);

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
      <div className="my-post-feed">
        <div className="my-post-feed-header">
          <h2 className="feed-title">My Posts</h2>
          <NotificationsWidget enableStream={false} />
        </div>

        <div className="new-post-container">
          <MentionComposerTextarea
              placeholder="What's on your mind? Use @name and #tags"
              value={newContent}
              onChange={setNewContent}
              rows={3}
          />
          <div className="post-input-row">
            <select
                value={newLearningPreference}
                onChange={(e) => setNewLearningPreference(e.target.value)}
            >
              <option value="">Select learning preference</option>
              {learningPreferenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
              ))}
            </select>

            <label className="file-picker-label">
              <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewImage(e.target.files[0] || null)}
              />
              <span>{newImage ? newImage.name : "Choose image"}</span>
            </label>
          </div>
          <button onClick={handleCreatePost}>Post</button>
        </div>

        <div className="feed-divider" />

        {loadingFeed && (
            <div className="feed-empty-state">Loading your posts...</div>
        )}

        {!loadingFeed && feedWarning && (
            <div className="feed-empty-state">{feedWarning}</div>
        )}

        {!loadingFeed && posts.length === 0 && (
            <div className="feed-empty-state">No posts yet. Create your first post.</div>
        )}

        <div className="space-y-6">
          {posts.slice(0, visibleCount).map((post) => (
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
                  api={api}
                  savedPostIds={savedPostIds}
                  onSaveStateChanged={loadSavedIds}
                  onShareSuccess={handleShareCreated}
              />
          ))}
        </div>

        {posts.length > visibleCount && (
            <div className="mt-4 flex justify-center">
              <button
                  type="button"
                  className="chip-btn"
                  onClick={() => setVisibleCount((current) => current + 12)}
              >
                Load more posts
              </button>
            </div>
        )}

        {previewModal}
      </div>
  );
};

export default MyPostFeed;
