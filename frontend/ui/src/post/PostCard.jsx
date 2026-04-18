import React, { useCallback, useEffect, useMemo, useState } from "react";
import PostReactions from "./PostReactions";
import CommentsModal from "./CommentsModal";
import { createComment, fetchCommentCount } from "./commentsApi";
import PostTextRenderer from "./PostTextRenderer";
import SavePostControl from "./SavePostControl";

const failedImageUrls = new Set();

const ShareButton = ({ targetPostId, api, onShareSuccess }) => {
  const [showInput, setShowInput] = useState(false);
  const [caption, setCaption] = useState("");
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    try {
      setSharing(true);
      const res = await api.post(
          `/shares/${targetPostId}/share`,
          { caption },
          { withCredentials: true }
      );
      if (typeof onShareSuccess === "function") {
        await onShareSuccess(res?.data);
      }
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
                  className="min-w-40 flex-1 rounded-xl border border-white/70 bg-white/65 px-3 py-2 text-sm text-slate-700 outline-none backdrop-blur-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="chip-btn chip-btn-compact"
              >
                {sharing ? "Sharing..." : "Share"}
              </button>
              <button
                  onClick={() => setShowInput(false)}
                  className="chip-btn chip-btn-compact"
              >
                Cancel
              </button>
            </div>
        ) : (
            <button
                onClick={() => setShowInput(true)}
                className="chip-btn chip-btn-compact"
            >
              Share
            </button>
        )}
      </div>
  );
};

const PostCard = ({
                    post,
                    backendBase,
                    activeMenu,
                    setActiveMenu,
                    onDeletePost,
                    onDeleteShare,
                    onPreviewImage,
                    imageRenderVersion,
                    highlightedSourcePostId,
                    api,
                    savedPostIds = [],
                    onSaveStateChanged,
                    onShareSuccess,
                    onHashtagClick,
                  }) => {
  const formatLearningPreference = (value) => {
    if (!value) return "";
    switch (value) {
      case "BACKEND":
        return "Backend Development";
      case "FRONTEND":
        return "Frontend Development";
      case "FULLSTACK":
        return "Full Stack Development";
      case "DATA_SCIENCE":
        return "Data Science";
      default:
        return value;
    }
  };

  const [commentCount, setCommentCount] = useState(Number(post.commentCount ?? 0));
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [quickComment, setQuickComment] = useState("");
  const [quickCommentFile, setQuickCommentFile] = useState(null);
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const isShare = post.type === "SHARE" || Boolean(post.originalPostId);
  const cardKey = isShare ? `share-${post.postId}` : `post-${post.postId}`;
  const sourcePostId = isShare ? post.originalPostId : post.postId;
  const sourceContent = post.content;
  const sourceAuthor = post.authorName;
  const sourceImageUrl = post.imageUrl;
  const sourceLearningPreference = post.learningPreference;
  const resolvedImageUrl = sourceImageUrl
      ? (sourceImageUrl.startsWith("http") ? sourceImageUrl : `${backendBase}${sourceImageUrl}`)
      : "";
  const knownMissingImage = resolvedImageUrl ? failedImageUrls.has(resolvedImageUrl) : false;
  const canShowImage = Boolean(sourceImageUrl) && Boolean(resolvedImageUrl) && !imageLoadFailed && !knownMissingImage;

  const sourceShareCount = Number(post.shareCount || 0);
  const eventTime = isShare ? post.sharedAt : post.createdAt;
  const isSaved = Array.isArray(savedPostIds) && savedPostIds.includes(sourcePostId);

  const handleImagePreview = () => {
    if (!canShowImage) return;

    if (typeof onPreviewImage === "function") {
      onPreviewImage(resolvedImageUrl);
      return;
    }

    window.open(resolvedImageUrl, "_blank", "noopener,noreferrer");
  };

  const modalTitle = useMemo(() => {
    if (isShare) {
      return `${post.sharedByName} shared ${sourceAuthor}'s post`;
    }
    return `${post.authorName}'s post`;
  }, [isShare, post.sharedByName, sourceAuthor, post.authorName]);

  const refreshCommentMeta = useCallback(async () => {
    try {
      const count = await fetchCommentCount(sourcePostId);
      setCommentCount(count);
    } catch (err) {
      console.error("Failed to fetch comment count:", err);
    }
  }, [sourcePostId]);

  const handleQuickCommentSubmit = async () => {
    if (!quickComment.trim() && !quickCommentFile) return;

    try {
      setQuickSubmitting(true);
      await createComment(sourcePostId, quickComment, quickCommentFile);
      setQuickComment("");
      setQuickCommentFile(null);
      await refreshCommentMeta();
    } catch (err) {
      console.error("Failed to add quick comment:", err);
      alert(err.response?.data?.message || "Failed to add comment");
    } finally {
      setQuickSubmitting(false);
    }
  };

  useEffect(() => {
    setImageLoadFailed(false);
  }, [resolvedImageUrl]);





  return (
      <article
          key={cardKey}
          data-source-post-id={sourcePostId}
          className={`rounded-3xl border border-[#e8e4db] bg-[linear-gradient(165deg,rgba(255,255,255,0.92),rgba(247,239,227,0.9))] p-4 shadow-[0_16px_34px_-16px_rgba(45,41,38,0.36)] transition ${
              activeMenu === cardKey ? "ring-2 ring-[#d6c2a5]" : ""
          } ${String(highlightedSourcePostId || "") === String(sourcePostId || "") ? "ring-2 ring-[#b49060] shadow-[0_22px_40px_-16px_rgba(135,109,71,0.48)]" : ""}`}
      >
        <header className="mb-3 flex items-start justify-between gap-4">
          <div>
            {isShare ? (
                <>
                  <p className="text-base font-bold text-[#2d2926]">{post.sharedByName} shared a post</p>
                  <p className="text-xs font-medium text-[#827a71]">
                    {eventTime ? new Date(eventTime).toLocaleString() : ""}
                  </p>
                  {sourceLearningPreference && (
                      <span className="mt-1 inline-flex rounded-full border border-[#d9ccb8] bg-[#f6efdf] px-2.5 py-0.5 text-[11px] font-semibold text-[#876d47]">
                  {formatLearningPreference(sourceLearningPreference)}
                </span>
                  )}
                </>
            ) : (
                <>
                  <p className="text-base font-bold text-[#2d2926]">{post.authorName}</p>
                  <p className="text-xs font-medium text-[#827a71]">
                    {eventTime ? new Date(eventTime).toLocaleString() : ""}
                  </p>
                  {sourceLearningPreference && (
                      <span className="mt-1 inline-flex rounded-full border border-[#d9ccb8] bg-[#f6efdf] px-2.5 py-0.5 text-[11px] font-semibold text-[#876d47]">
                  {formatLearningPreference(sourceLearningPreference)}
                </span>
                  )}
                </>
            )}
          </div>

          <div className="relative">
            <button
                onClick={() => setActiveMenu(activeMenu === cardKey ? null : cardKey)}
                className="chip-btn chip-btn-small px-3 text-base"
            >
              ⋯
            </button>

            {activeMenu === cardKey && (
                <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-[#e8e4db] bg-[linear-gradient(155deg,rgba(255,255,255,0.96),rgba(246,239,227,0.92))] p-2 shadow-2xl backdrop-blur-xl">
                  {isShare ? (
                      <button
                          onClick={() => onDeleteShare(post.postId)}
                          className="chip-btn chip-btn-compact chip-btn-wide mb-2"
                      >
                        Delete share
                      </button>
                  ) : (
                      <button
                          onClick={() => onDeletePost(post.postId)}
                          className="chip-btn chip-btn-compact chip-btn-wide mb-2"
                      >
                        Delete post
                      </button>
                  )}
                  <div className="mb-2">
                    <SavePostControl
                        postId={sourcePostId}
                        isSaved={isSaved}
                        onChanged={onSaveStateChanged}
                    />
                  </div>
                  <ShareButton
                      targetPostId={sourcePostId}
                      api={api}
                      onShareSuccess={async (shareData) => {
                        if (typeof onShareSuccess === "function") {
                          await onShareSuccess(shareData);
                        }
                        setActiveMenu(null);
                      }}
                  />
                </div>
            )}
          </div>
        </header>

        <div className="mb-3 space-y-2.5">
          {isShare && post.shareCaption && (
              <p className="whitespace-pre-wrap text-sm italic leading-relaxed text-[#5c544d]">{post.shareCaption}</p>
          )}

          <div className="rounded-3xl border border-[#efe6d8] bg-[linear-gradient(155deg,rgba(255,255,255,0.95),rgba(250,244,235,0.92))] p-2.5 shadow-[0_8px_20px_rgba(45,41,38,0.08)]">
            {isShare && <p className="text-base font-bold text-[#2d2926]">{sourceAuthor}</p>}
            <div className="mt-1.5">
              <PostTextRenderer text={sourceContent} onHashtagClick={onHashtagClick} />
            </div>


            {canShowImage && (
                <button
                    type="button"
                    className="mt-2 mx-auto block w-fit max-w-full cursor-zoom-in"
                    onClick={handleImagePreview}
                    title="Click to view full image"
                    aria-label="Open full image"
                >
                  <div className="relative isolate rounded-2xl bg-white p-2 shadow-[0_10px_25px_rgba(0,0,0,0.12)]">
                    <img
                        key={`${resolvedImageUrl}-${imageRenderVersion || 0}`}
                        src={resolvedImageUrl}
                        alt="post"
                        onError={() => {
                          if (resolvedImageUrl) {
                            failedImageUrls.add(resolvedImageUrl);
                          }
                          setImageLoadFailed(true);
                        }}
                        className="post-image-safe block max-h-[24rem] max-w-full rounded-xl bg-white object-contain"
                        style={{ filter: "none", opacity: 1, imageRendering: "auto", transform: "translateZ(0)", backfaceVisibility: "hidden", contain: "paint" }}
                        decoding="async"
                        loading="lazy"
                    />
                  </div>
                </button>
            )}
            {sourceImageUrl && (imageLoadFailed || knownMissingImage) && (
                <p className="mt-3 text-xs font-semibold text-[#9a8472]">Image unavailable</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e8e4db] bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(248,241,230,0.82))] px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <PostReactions postId={sourcePostId} />
            <div className="text-xs font-semibold text-[#746257]">Shares: {sourceShareCount}</div>
          </div>
        </div>

        <div className="mt-2.5 rounded-2xl border border-[#e8e4db] bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(247,240,228,0.88))] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-[#2d2926]">Comments ({commentCount})</h4>
            <button
                type="button"
                className="chip-btn chip-btn-compact"
                onClick={async () => {
                  setIsCommentsModalOpen(true);
                  await refreshCommentMeta();
                }}
            >
              View all comments
            </button>
          </div>

          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
                type="text"
                value={quickComment}
                onChange={(event) => setQuickComment(event.target.value)}
                placeholder="Add a comment..."
                className="flex-1 rounded-xl border border-[#ddd2c1] bg-[#fffdfa] px-3 py-2 text-xs text-[#2d2926] outline-none transition focus:border-[#b49060] focus:ring-2 focus:ring-[#b49060]/20"
            />
            <input
                type="file"
                className="chip-file-input max-w-full rounded-xl border border-dashed border-[#b49060]/50 bg-[#faf5eb]/80 p-2 text-xs text-[#876d47] sm:max-w-[220px]"
                onChange={(event) => setQuickCommentFile(event.target.files?.[0] || null)}
            />
            <button
                type="button"
                onClick={handleQuickCommentSubmit}
                disabled={quickSubmitting}
                className="chip-btn chip-btn-compact"
            >
              {quickSubmitting ? "Posting..." : "Comment"}
            </button>
          </div>

          <p className="text-xs text-[#827a71]">Open the comments modal to view and manage the full discussion.</p>
        </div>

        <CommentsModal
            isOpen={isCommentsModalOpen}
            onClose={() => setIsCommentsModalOpen(false)}
            postId={sourcePostId}
            title={modalTitle}
            backendBase={backendBase}
            onCommentsChanged={refreshCommentMeta}
        />
      </article>
  );
};

export default PostCard;
