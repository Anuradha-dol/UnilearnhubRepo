import React, { useCallback, useEffect, useState } from "react";
import api from "../api";
import CommentSection from "./CommentSection";
import PostReactions from "./PostReactions";
import "./MyPostFeed.css";

const MyPostFeed = () => {
  const [posts, setPosts] = useState([]);
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  const buildImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${api.defaults.baseURL || ""}${path}`;
  };

  const refreshMyPosts = useCallback(async () => {
    const [postsRes, sharesRes] = await Promise.all([
      api.get("/posts/my"),
      api.get("/shares/my"),
    ]);

    const myPosts = postsRes.data || [];
    const myShares = sharesRes.data || [];
    const merged = [...myPosts, ...myShares].sort(
      (a, b) => new Date(b.createdAt || b.sharedAt) - new Date(a.createdAt || a.sharedAt)
    );

    setPosts(merged);
  }, []);

  const handleCreatePost = async () => {
    if (!newContent.trim() && !newImage) return;

    try {
      const formData = new FormData();
      formData.append("content", newContent);
      if (newImage) formData.append("image", newImage);

      const res = await api.post("/posts/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPosts((prev) => [res.data, ...prev]);
      await refreshMyPosts();
      setNewContent("");
      setNewImage(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/delete/${postId}`);
      setPosts((prev) => prev.filter((p) => !(p.type !== "SHARE" && p.postId === postId)));
      await refreshMyPosts();
      setActiveMenu(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSharePost = async (post) => {
    const caption = prompt("Add a caption to your share (optional):", "");
    if (caption === null) return;

    try {
      const targetPostId = post.originalPostId || post.postId;
      const res = await api.post(`/shares/${targetPostId}/share`, { caption });
      setPosts((prev) => [res.data, ...prev]);
      await refreshMyPosts();
      setActiveMenu(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to share post");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadMyPosts = async () => {
      try {
        await refreshMyPosts();

        if (!cancelled) {
          return;
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadMyPosts();

    return () => {
      cancelled = true;
    };
  }, [refreshMyPosts]);

  return (
    <div className="my-post-feed">
      <h2 className="feed-title">My Posts</h2>

      <div className="new-post-container">
        <textarea
          placeholder="What's on your mind?"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          rows={3}
        />
        <div className="post-input-row">
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

      {posts.length === 0 && (
        <div className="feed-empty-state">No posts yet. Create your first post.</div>
      )}

      {posts.map((item) => {
        const isShare = !!item.originalPostId;
        const postKey = isShare ? `share-${item.shareId || item.postId}` : `post-${item.postId}`;
        const shareCaption = item.shareCaption || item.caption;
        const originalAuthorName = item.originalAuthorName || item.authorName;
        const originalContent = item.originalContent || item.content;
        const originalImageUrl = item.originalImageUrl || item.imageUrl;

        return (
          <div
            key={postKey}
            className={`post-card ${activeMenu === postKey ? "show-menu" : ""}`}
          >
            <div className="post-header">
              {isShare ? (
                <strong>{item.sharedByName} shared a post</strong>
              ) : (
                <strong>{item.authorName} - {new Date(item.createdAt).toLocaleString()}</strong>
              )}

              <div className="post-options">
                <button
                  onClick={() =>
                    setActiveMenu(activeMenu === postKey ? null : postKey)
                  }
                >
                  ⋯
                </button>
                <div className="post-menu">
                  {!isShare && (
                    <button onClick={() => handleDeletePost(item.postId)}>Delete</button>
                  )}
                  <button onClick={() => handleSharePost(item)}>Share</button>
                </div>
              </div>
            </div>

            <div className="post-content">
              {isShare ? (
                <>
                  {shareCaption && <p style={{ fontStyle: "italic" }}>{shareCaption}</p>}
                  <div className="shared-post">
                    <p><strong>{originalAuthorName}</strong></p>
                    <p>{originalContent}</p>
                    {originalImageUrl && (
                      <img
                        src={buildImageUrl(originalImageUrl)}
                        alt="shared post"
                      />
                    )}
                    <PostReactions postId={item.originalPostId} />
                    <CommentSection postId={item.originalPostId} />
                  </div>
                </>
              ) : (
                <>
                  <p>{item.content}</p>
                  {item.imageUrl && (
                    <img
                      src={buildImageUrl(item.imageUrl)}
                      alt="post"
                    />
                  )}
                  <PostReactions postId={item.postId} />
                  <CommentSection postId={item.postId} />
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MyPostFeed;