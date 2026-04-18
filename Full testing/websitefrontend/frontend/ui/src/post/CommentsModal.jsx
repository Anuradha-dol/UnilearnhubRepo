import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  createComment,
  deleteCommentById,
  fetchAllComments,
  replyToComment,
  updateCommentById,
} from "./commentsApi";
import MentionComposerTextarea from "./MentionComposerTextarea";
import PostTextRenderer from "./PostTextRenderer";

const CommentsModal = ({
                         isOpen,
                         onClose,
                         postId,
                         title,
                         onCommentsChanged,
                         backendBase,
                       }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newCommentFile, setNewCommentFile] = useState(null);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

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

  const resolveAttachmentUrl = (url) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${backendBase}${url}`;
  };

  const isImageAttachment = (url) => {
    if (!url) return false;
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
  };

  const getErrorMessage = (err, fallback) => {
    const data = err?.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object" && typeof data.message === "string") {
      return data.message;
    }

    return fallback;
  };

  const refreshComments = async () => {
    await loadComments();
    if (onCommentsChanged) {
      await onCommentsChanged();
    }
  };

  const loadComments = useCallback(async () => {
    if (!postId) return;

    try {
      setLoading(true);
      const data = await fetchAllComments(postId);
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments:", err);
      alert(err.response?.data?.message || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const handleSubmit = async () => {
    if (!newComment.trim() && !newCommentFile) return;

    try {
      setSubmitting(true);
      await createComment(postId, newComment, newCommentFile);
      setNewComment("");
      setNewCommentFile(null);
      await refreshComments();
    } catch (err) {
      console.error("Failed to add comment:", err);
      alert(getErrorMessage(err, "Failed to add comment"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentCommentId) => {
    const draft = getReplyDraft(parentCommentId);
    if (!draft.content.trim() && !draft.file) return;

    try {
      setActionBusy(true);
      await replyToComment(postId, parentCommentId, draft.content, draft.file);
      setReplyingToId(null);
      clearReplyDraft(parentCommentId);
      await refreshComments();
    } catch (err) {
      console.error("Failed to reply:", err);
      alert(getErrorMessage(err, "Failed to add reply"));
    } finally {
      setActionBusy(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      setActionBusy(true);
      await deleteCommentById(commentId);
      await refreshComments();
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert(getErrorMessage(err, "You can only delete your own comment."));
    } finally {
      setActionBusy(false);
    }
  };

  const handleUpdate = async (commentId) => {
    if (!editingContent.trim()) {
      alert("Comment cannot be empty");
      return;
    }

    try {
      setActionBusy(true);
      await updateCommentById(commentId, editingContent.trim());
      setEditingCommentId(null);
      setEditingContent("");
      await refreshComments();
    } catch (err) {
      console.error("Failed to update comment:", err);
      alert(getErrorMessage(err, "You can only edit your own comment."));
    } finally {
      setActionBusy(false);
    }
  };

  const renderAttachment = (comment) => {
    if (!comment.attachmentUrl) return null;

    return (
        <div className="mt-2">
          {isImageAttachment(comment.attachmentUrl) ? (
              <img
                  src={resolveAttachmentUrl(comment.attachmentUrl)}
                  alt="comment attachment"
                  className="max-h-64 max-w-full rounded-lg border border-[#e8e4db]"
              />
          ) : (
              <a
                  href={resolveAttachmentUrl(comment.attachmentUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-[#876d47] underline"
              >
                View attachment
              </a>
          )}
        </div>
    );
  };

  const renderComment = (comment, depth = 0) => {
    const isEditing = editingCommentId === comment.commentId;
    const isReplying = replyingToId === comment.commentId;
    const draft = getReplyDraft(comment.commentId);

    return (
        <div
            key={comment.commentId}
            className="rounded-xl border border-[#e8e1d5] bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(249,243,233,0.88))] p-3 shadow-[0_8px_18px_rgba(45,41,38,0.08)]"
            style={{ marginLeft: `${Math.min(depth * 18, 54)}px` }}
        >
          <div className="text-sm font-semibold text-[#2d2926]">{comment.authorName}</div>

          {isEditing ? (
              <div className="mt-2 space-y-2">
                <input
                    type="text"
                    className="w-full rounded-lg border border-[#ddd2c1] bg-[#fffdfa] px-3 py-2 text-sm outline-none focus:border-[#b49060] focus:ring-2 focus:ring-[#b49060]/20"
                    value={editingContent}
                    onChange={(event) => setEditingContent(event.target.value)}
                />
                <div className="flex items-center gap-2">
                  <button
                      type="button"
                      className="chip-btn chip-btn-compact"
                      onClick={() => handleUpdate(comment.commentId)}
                      disabled={actionBusy}
                  >
                    Save
                  </button>
                  <button
                      type="button"
                      className="chip-btn chip-btn-compact"
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditingContent("");
                      }}
                      disabled={actionBusy}
                  >
                    Cancel
                  </button>
                </div>
              </div>
          ) : (
              <>
                <div className="mt-1 whitespace-pre-wrap text-sm text-[#5c544d]">
                  {comment.content?.trim() ? <PostTextRenderer text={comment.content} /> : "(Attachment only)"}
                </div>
                {renderAttachment(comment)}
              </>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
                type="button"
                className="chip-btn chip-btn-small"
                onClick={() => {
                  setReplyingToId((prev) => (prev === comment.commentId ? null : comment.commentId));
                  setReplyDraft(comment.commentId, { content: "", file: null });
                }}
            >
              Reply
            </button>

            <button
                type="button"
                className="chip-btn chip-btn-small"
                onClick={() => {
                  setEditingCommentId(comment.commentId);
                  setEditingContent(comment.content || "");
                }}
            >
              Edit
            </button>

            <button
                type="button"
                className="chip-btn chip-btn-small"
                onClick={() => handleDelete(comment.commentId)}
                disabled={actionBusy}
            >
              Delete
            </button>
          </div>

          {isReplying && (
              <div className="mt-3 rounded-lg border border-[#ddd2c1] bg-[linear-gradient(160deg,rgba(255,255,255,0.76),rgba(245,236,223,0.72))] p-2.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <MentionComposerTextarea
                      placeholder="Write a reply..."
                      value={draft.content}
                      onChange={(value) => setReplyDraft(comment.commentId, { content: value })}
                      rows={2}
                      className="flex-1 rounded-lg border border-[#ddd2c1] bg-[#fffdfa] px-2.5 py-1.5 text-xs text-[#2d2926] outline-none focus:border-[#b49060] focus:ring-2 focus:ring-[#b49060]/20"
                  />
                  <input
                      type="file"
                      className="chip-file-input max-w-full rounded-lg border border-dashed border-[#b49060]/50 bg-white p-1.5 text-xs text-[#876d47] sm:max-w-[220px]"
                      onChange={(event) => setReplyDraft(comment.commentId, { file: event.target.files?.[0] || null })}
                  />
                  <button
                      type="button"
                      className="chip-btn chip-btn-compact"
                      onClick={() => handleReplySubmit(comment.commentId)}
                      disabled={actionBusy}
                  >
                    Reply
                  </button>
                </div>
              </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-2">
                {comment.replies.map((reply) => renderComment(reply, depth + 1))}
              </div>
          )}
        </div>
    );
  };

  useEffect(() => {
    if (!isOpen) return;
    loadComments();
  }, [isOpen, loadComments]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
      <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-[#2d2926]/45 p-4 backdrop-blur-md"
          onClick={onClose}
      >
        <div
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[#e8e4db] bg-[linear-gradient(160deg,rgba(255,255,255,0.95),rgba(245,236,222,0.9))] p-5 shadow-[0_26px_60px_rgba(45,41,38,0.22)]"
            onClick={(event) => event.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(180,144,96,0.12),transparent_36%),radial-gradient(circle_at_90%_86%,rgba(130,122,113,0.1),transparent_34%)]" />
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#2d2926]">Comments</h3>
              <p className="text-xs text-[#827a71]">{title}</p>
            </div>
            <button
                type="button"
                className="chip-btn chip-btn-regular"
                onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="relative mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <MentionComposerTextarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={setNewComment}
                rows={2}
                className="flex-1 rounded-xl border border-[#ddd2c1] bg-[#fffdfa] px-3 py-2 text-sm text-[#2d2926] outline-none transition focus:border-[#b49060] focus:ring-2 focus:ring-[#b49060]/20"
            />
            <input
                type="file"
                className="chip-file-input max-w-full rounded-xl border border-dashed border-[#b49060]/50 bg-[#faf5eb]/80 p-2 text-xs text-[#876d47] sm:max-w-[240px]"
                onChange={(event) => setNewCommentFile(event.target.files?.[0] || null)}
            />
            <button
                type="button"
                className="chip-btn chip-btn-regular"
                onClick={handleSubmit}
                disabled={submitting}
            >
              {submitting ? "Posting..." : "Comment"}
            </button>
          </div>

          <div className="relative max-h-[55vh] space-y-2 overflow-y-auto rounded-2xl border border-[#e8e1d5] bg-[linear-gradient(170deg,rgba(255,255,255,0.72),rgba(247,240,230,0.72))] p-2">
            {loading ? (
                <p className="p-2 text-sm text-[#827a71]">Loading comments...</p>
            ) : comments.length === 0 ? (
                <p className="p-2 text-sm text-[#827a71]">No comments yet.</p>
            ) : (
                comments.map((comment) => renderComment(comment))
            )}
          </div>
        </div>
      </div>
  );

  if (typeof document === "undefined") {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};

export default CommentsModal;
