import React, { useEffect, useState } from "react";
import api from "../api";
import CommentSection from "./CommentSection";
import PostReactions from "./PostReactions";

// Share button component
const ShareButton = ({ postId }) => {
  const [showInput, setShowInput] = useState(false);
  const [caption, setCaption] = useState("");
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    try {
      setSharing(true);
      const res = await api.post(
        `/shares/${postId}/share`,
        { caption },
        { withCredentials: true } // send cookies for auth
      );
      alert(`Shared by: ${res.data.sharedByName}`);
      setCaption("");
      setShowInput(false);
    } catch (err) {
      console.error("Error sharing post:", err);
      alert(err.response?.data?.message || "Failed to share post. Try again.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="mt-2">
      {showInput ? (
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-w-40 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <button
            onClick={handleShare}
            disabled={sharing}
            className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sharing ? "Sharing..." : "Share"}
          </button>
          <button
            onClick={() => setShowInput(false)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Share
        </button>
      )}
    </div>
  );
};

const PostFeed = () => {
  const [posts, setPosts] = useState([]);
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [creating, setCreating] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const backendBase = api.defaults.baseURL || "http://localhost:8081";
  const MAX_CONTENT_LENGTH = 2000;
  const MAX_IMAGE_SIZE_MB = 5;
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  const getErrorMessage = (err, fallback) => {
    const data = err?.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object" && typeof data.message === "string") return data.message;
    if (typeof err?.message === "string" && err.message.trim()) return err.message;
    return fallback;
  };

  // Fetch posts from feed
  const fetchPosts = async () => {
    try {
      const res = await api.get("/posts/feed", { withCredentials: true });
      setPosts(res.data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  // Create new post
  const validatePostForm = (content, image) => {
    const errors = {};
    const trimmedContent = content.trim();

    if (!trimmedContent && !image) {
      errors.form = "Please add text or attach an image before posting.";
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
      const validationErrors = validatePostForm(newContent, newImage);
      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        return;
      }

      setFormErrors({});

      setCreating(true);
      const formData = new FormData();
      formData.append("content", newContent);
      if (newImage) formData.append("image", newImage);

      const res = await api.post("/posts/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true, // send cookies
      });

      setPosts((prev) => [res.data, ...prev]);
      setNewContent("");
      setNewImage(null);
      setFormErrors({});
    } catch (err) {
      console.error("Error creating post:", err);
      alert(getErrorMessage(err, "Failed to create post. Try again."));
    } finally {
      setCreating(false);
    }
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/delete/${postId}`, { withCredentials: true });
      setPosts((prev) => prev.filter((p) => p.postId !== postId));
      setActiveMenu(null);
    } catch (err) {
      console.error("Error deleting post:", err);
      if (err.response?.status === 403) {
        alert("You are not authorized to delete this post.");
      } else {
        alert("Failed to delete post. Try again.");
      }
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Community Feed</h2>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Live
            </span>
          </div>

          <div className="space-y-4">
            <textarea
              placeholder="Share your progress, tips, or questions..."
              value={newContent}
              onChange={(e) => {
                const value = e.target.value;
                setNewContent(value);
                setFormErrors((prev) => {
                  const next = { ...prev };
                  if (value.trim().length <= MAX_CONTENT_LENGTH) delete next.content;
                  if (value.trim() || newImage) delete next.form;
                  return next;
                });
              }}
              className="h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
            <div className="flex items-center justify-between">
              <p className={`text-xs ${newContent.length > MAX_CONTENT_LENGTH ? "text-rose-600" : "text-slate-500"}`}>
                {newContent.length}/{MAX_CONTENT_LENGTH}
              </p>
              {formErrors.content && <p className="text-xs font-medium text-rose-600">{formErrors.content}</p>}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100">
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
                <span>Attach image</span>
              </label>

              {newImage && (
                <span className="max-w-xs truncate text-xs font-medium text-slate-600">
                  Selected: {newImage.name}
                </span>
              )}

              <button
                onClick={handleCreatePost}
                disabled={creating}
                className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? "Posting..." : "Post"}
              </button>
            </div>
            {formErrors.image && <p className="text-xs font-medium text-rose-600">{formErrors.image}</p>}
            {formErrors.form && <p className="text-sm font-semibold text-rose-600">{formErrors.form}</p>}
          </div>
        </div>

        <div className="space-y-5">
          {posts.map((post) => (
            <article
              key={post.postId}
              className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-lg transition ${
                activeMenu === post.postId ? "ring-2 ring-indigo-200" : ""
              }`}
            >
              <header className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-bold text-slate-900">{post.authorName}</p>
                  <p className="text-xs font-medium text-slate-500">
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === post.postId ? null : post.postId)}
                    className="rounded-xl px-2 py-1 text-lg font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  >
                    ⋯
                  </button>

                  {activeMenu === post.postId && (
                    <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
                      <button
                        onClick={() => handleDeletePost(post.postId)}
                        className="mb-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        Delete post
                      </button>
                      <ShareButton postId={post.postId} />
                    </div>
                  )}
                </div>
              </header>

              <div className="mb-4 space-y-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{post.content}</p>
                {post.imageUrl && (
                  <img
                    src={post.imageUrl.startsWith("http") ? post.imageUrl : `${backendBase}${post.imageUrl}`}
                    alt="post"
                    className="max-h-[30rem] w-full rounded-2xl border border-slate-200 object-cover"
                  />
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <PostReactions postId={post.postId} />
              </div>

              <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-2">
                <CommentSection postId={post.postId} />
              </div>
            </article>
          ))}

          {posts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center text-slate-500">
              No posts yet. Create the first one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostFeed;