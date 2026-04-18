import React, { useEffect, useState } from "react";
import api from "../api";
import "./CommentSection.css";

const CommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newCommentFile, setNewCommentFile] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [activeMenu, setActiveMenu] = useState(null);
  const backendBase = api.defaults.baseURL || "http://localhost:8081";

  const getReplyDraft = (commentId) => replyDrafts[commentId] || { content: "", file: null };

  const setReplyDraft = (commentId, patch) => {
    setReplyDrafts((prev) => ({
      ...prev,
      [commentId]: {
        ...getReplyDraft(commentId),
        ...patch,
      },
    }));
  };

  const clearReplyDraft = (commentId) => {
    setReplyDrafts((prev) => {
      const next = { ...prev };
      delete next[commentId];
      return next;
    });
  };

  const insertReplyRecursively = (list, parentId, reply) =>
    list.map((comment) => {
      if (comment.commentId === parentId) {
        return { ...comment, replies: [...(comment.replies || []), reply] };
      }

      if (!comment.replies || comment.replies.length === 0) {
        return comment;
      }

      return {
        ...comment,
        replies: insertReplyRecursively(comment.replies, parentId, reply),
      };
    });

  const isImageAttachment = (url) => {
    if (!url) return false;
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
  };

  const attachmentUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${backendBase}${url}`;
  };

  const handleAddComment = async () => {
    if (!newComment.trim() && !newCommentFile) return;

    try {
      const formData = new FormData();
      formData.append("content", newComment || "");
      if (newCommentFile) formData.append("attachment", newCommentFile);

      const res = await api.post(`/comments/${postId}/add`, formData, {
        withCredentials: true,
      });
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
      setNewCommentFile(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add comment");
    }
  };

  const handleReply = async (parentId) => {
    const draft = getReplyDraft(parentId);
    if (!draft.content.trim() && !draft.file) return;

    try {
      const formData = new FormData();
      formData.append("content", draft.content || "");
      if (draft.file) formData.append("attachment", draft.file);

      const res = await api.post(`/comments/${postId}/reply/${parentId}`, formData, {
        withCredentials: true,
      });
      setComments((prev) => insertReplyRecursively(prev, parentId, res.data));
      setReplyingToId(null);
      clearReplyDraft(parentId);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to send reply");
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}/delete`);
      const removeComment = (list) =>
        list.filter((c) => c.commentId !== commentId).map((c) => ({ ...c, replies: removeComment(c.replies || []) }));
      setComments((prev) => removeComment(prev));
    } catch (err) {
      console.error(err);
      alert(err.response?.data || "Failed to delete");
    }
  };

  const handleUpdate = async (commentId, content) => {
    try {
      await api.put(`/comments/${commentId}/update`, { content });
      const updateComment = (list) =>
        list.map((c) => {
          if (c.commentId === commentId) return { ...c, content };
          return { ...c, replies: updateComment(c.replies || []) };
        });
      setComments((prev) => updateComment(prev));
      setEditingCommentId(null);
      setEditingContent("");
    } catch (err) {
      console.error(err);
      alert("Failed to update comment");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadComments = async () => {
      try {
        const res = await api.get(`/comments/${postId}/all`);
        if (!cancelled) {
          setComments(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadComments();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  const renderReplies = (replies) =>
    (replies || []).map((r) => (
      <div key={r.commentId} className="comment-reply">
        <div className={`comment-card ${activeMenu === r.commentId ? "show-menu" : ""}`}>
          <div className="comment-header">
            <strong>{r.authorName}</strong>
            <div className="comment-options">
              <button className="options-button" onClick={() => setActiveMenu(activeMenu === r.commentId ? null : r.commentId)}>⋯</button>
              {activeMenu === r.commentId && (
                <div className="options-menu">
                  <button onClick={() => { setEditingCommentId(r.commentId); setEditingContent(r.content); setActiveMenu(null); }}>Edit</button>
                  <button onClick={() => { handleDelete(r.commentId); setActiveMenu(null); }}>Delete</button>
                </div>
              )}
            </div>
          </div>

          <div className="comment-content">
            {editingCommentId === r.commentId ? (
              <>
                <input className="comment-edit-input" value={editingContent} onChange={(e) => setEditingContent(e.target.value)} />
                <div className="edit-buttons">
                  <button onClick={() => handleUpdate(r.commentId, editingContent)}>Save</button>
                  <button onClick={() => setEditingCommentId(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <span>{r.content}</span>
                {r.attachmentUrl && (
                  <div style={{ marginTop: "8px" }}>
                    {isImageAttachment(r.attachmentUrl) ? (
                      <img
                        src={attachmentUrl(r.attachmentUrl)}
                        alt="reply attachment"
                        style={{ maxWidth: "260px", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      />
                    ) : (
                      <a href={attachmentUrl(r.attachmentUrl)} target="_blank" rel="noreferrer">
                        View attachment
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="comment-actions">
            <button
              onClick={() => {
                setReplyingToId(r.commentId);
                setReplyDraft(r.commentId, { content: "", file: null });
              }}
            >
              Reply
            </button>
          </div>

          {replyingToId === r.commentId && (
            <div className="reply-input-container">
              <input
                value={getReplyDraft(r.commentId).content}
                onChange={(e) => setReplyDraft(r.commentId, { content: e.target.value })}
                placeholder="Write a reply..."
              />
              <input
                type="file"
                onChange={(e) => setReplyDraft(r.commentId, { file: e.target.files?.[0] || null })}
                style={{ maxWidth: "220px" }}
              />
              <button onClick={() => handleReply(r.commentId)}>Reply</button>
            </div>
          )}

          {r.replies && renderReplies(r.replies)}
        </div>
      </div>
    ));

  return (
    <div className="comment-section">
      <h4>Comments</h4>

      <div className="comment-input-container">
        <input
          type="text"
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <input
          type="file"
          onChange={(e) => setNewCommentFile(e.target.files?.[0] || null)}
          style={{ maxWidth: "220px" }}
        />
        <button onClick={handleAddComment}>Comment</button>
      </div>

      {comments.map((c) => (
        <div key={c.commentId} className={`comment-card ${activeMenu === c.commentId ? "show-menu" : ""}`}>
          <div className="comment-header">
            <strong>{c.authorName}</strong>
            <div className="comment-options">
              <button className="options-button" onClick={() => setActiveMenu(activeMenu === c.commentId ? null : c.commentId)}>⋯</button>
              {activeMenu === c.commentId && (
                <div className="options-menu">
                  <button onClick={() => { setEditingCommentId(c.commentId); setEditingContent(c.content); setActiveMenu(null); }}>Edit</button>
                  <button onClick={() => { handleDelete(c.commentId); setActiveMenu(null); }}>Delete</button>
                </div>
              )}
            </div>
          </div>

          <div className="comment-content">
            {editingCommentId === c.commentId ? (
              <>
                <input className="comment-edit-input" value={editingContent} onChange={(e) => setEditingContent(e.target.value)} />
                <div className="edit-buttons">
                  <button onClick={() => handleUpdate(c.commentId, editingContent)}>Save</button>
                  <button onClick={() => setEditingCommentId(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <span>{c.content}</span>
                {c.attachmentUrl && (
                  <div style={{ marginTop: "8px" }}>
                    {isImageAttachment(c.attachmentUrl) ? (
                      <img
                        src={attachmentUrl(c.attachmentUrl)}
                        alt="comment attachment"
                        style={{ maxWidth: "260px", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      />
                    ) : (
                      <a href={attachmentUrl(c.attachmentUrl)} target="_blank" rel="noreferrer">
                        View attachment
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="comment-actions">
            <button
              onClick={() => {
                setReplyingToId(c.commentId);
                setReplyDraft(c.commentId, { content: "", file: null });
              }}
            >
              Reply
            </button>
          </div>

          {replyingToId === c.commentId && (
            <div className="reply-input-container">
              <input
                value={getReplyDraft(c.commentId).content}
                onChange={(e) => setReplyDraft(c.commentId, { content: e.target.value })}
                placeholder="Write a reply..."
              />
              <input
                type="file"
                onChange={(e) => setReplyDraft(c.commentId, { file: e.target.files?.[0] || null })}
                style={{ maxWidth: "220px" }}
              />
              <button onClick={() => handleReply(c.commentId)}>Reply</button>
            </div>
          )}

          {c.replies && renderReplies(c.replies)}
        </div>
      ))}
    </div>
  );
};

export default CommentSection;