import React, { useEffect, useRef, useState } from "react";
import api from "../api";
import "./PostReactions.css";

const BACKEND_UNLIKE_FALLBACK_TYPE = "angry";

const reactionOptions = [
  { type: "like", label: "Like" },
  { type: "unlike", label: "Unlike" },
];

const REACTION_CACHE_TTL_MS = 30000;
const reactionCache = new Map();

const ReactionIcon = ({ type, className = "" }) => {
  if (type === "unlike") {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path
              d="M17 14V2"
          />
          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-7A2 2 0 0 1 6.5 3H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 23a3 3 0 0 1-3-4.88Z" />
        </svg>
    );
  }

  return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path
            d="M7 10v12"
        />
        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 7A2 2 0 0 1 17.5 21H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 1a3 3 0 0 1 3 4.88Z" />
      </svg>
  );
};

const PostReactions = ({ postId }) => {
  const [reactionCounts, setReactionCounts] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const rootRef = useRef(null);

  const normalizeReactionType = (type) => {
    if (!type) return null;
    return type === BACKEND_UNLIKE_FALLBACK_TYPE ? "unlike" : type;
  };

  const getErrorMessage = (err, fallback) => {
    const data = err?.response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object" && typeof data.message === "string") return data.message;
    return fallback;
  };

  const getUpdatedCounts = (counts, previousType, nextType) => {
    const nextCounts = {
      like: Number(counts.like || 0),
      unlike: Number(counts.unlike || 0),
    };

    if (previousType === "like") {
      nextCounts.like = Math.max(0, nextCounts.like - 1);
    } else if (previousType === "unlike") {
      nextCounts.unlike = Math.max(0, nextCounts.unlike - 1);
    }

    if (nextType === "like") {
      nextCounts.like += 1;
    } else if (nextType === "unlike") {
      nextCounts.unlike += 1;
    }

    return nextCounts;
  };

  const fetchReactions = async ({ forceRefresh = false, fallbackUserReaction = null } = {}) => {
    const cacheKey = String(postId);
    const cached = reactionCache.get(cacheKey);
    if (!forceRefresh && cached && Date.now() - cached.ts < REACTION_CACHE_TTL_MS) {
      setReactionCounts(cached.counts);
      setUserReaction(cached.userReaction);
      return;
    }

    try {
      const res = await api.get(`/reactions/${postId}/counts`, { withCredentials: true });
      const normalizedCounts = {
        like: Number(res.data?.like || 0),
        unlike: Number(res.data?.unlike ?? res.data?.[BACKEND_UNLIKE_FALLBACK_TYPE] ?? 0),
      };
      const hasUserReaction = Object.prototype.hasOwnProperty.call(res.data || {}, "userReaction");
      const normalizedUserReaction = hasUserReaction
          ? normalizeReactionType(res.data?.userReaction)
          : fallbackUserReaction;

      setReactionCounts(normalizedCounts);
      setUserReaction(normalizedUserReaction);

      reactionCache.set(cacheKey, {
        ts: Date.now(),
        counts: normalizedCounts,
        userReaction: normalizedUserReaction,
      });
    } catch (err) {
      console.error("Error fetching reactions:", err);
    }
  };

  const handleReact = async (type) => {
    if (isReacting) return;

    const previousReaction = userReaction;
    const nextReaction = previousReaction === type ? null : type;

    try {
      setIsReacting(true);

      if (nextReaction === null) {
        await api.delete(`/reactions/${postId}`, { withCredentials: true });
      } else {
        try {
          await api.post(`/reactions/${postId}`, null, { params: { type: nextReaction }, withCredentials: true });
        } catch (err) {
          const status = err?.response?.status;
          // Compatibility fallback if a stale backend still expects old reaction keys.
          if (nextReaction === "unlike" && status === 400) {
            await api.post(`/reactions/${postId}`, null, {
              params: { type: BACKEND_UNLIKE_FALLBACK_TYPE },
              withCredentials: true,
            });
          } else {
            throw err;
          }
        }
      }

      setUserReaction(nextReaction);
      setReactionCounts((currentCounts) => {
        const optimisticCounts = getUpdatedCounts(currentCounts, previousReaction, nextReaction);
        reactionCache.set(String(postId), {
          ts: Date.now(),
          counts: optimisticCounts,
          userReaction: nextReaction,
        });
        return optimisticCounts;
      });

      await fetchReactions({ forceRefresh: true, fallbackUserReaction: nextReaction });
    } catch (err) {
      console.error("Error reacting:", err);
      if (err.response && (err.response.status === 403 || err.response.status === 401)) {
        alert("You are not authorized. Please log in.");
      } else {
        alert(getErrorMessage(err, "Failed to react. Please try again."));
      }
    } finally {
      setIsReacting(false);
    }
  };

  useEffect(() => {
    setShouldLoad(false);
  }, [postId]);

  useEffect(() => {
    if (shouldLoad) return;

    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setShouldLoad(true);
            observer.disconnect();
          }
        },
        { rootMargin: "120px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad) return;
    fetchReactions();
  }, [postId, shouldLoad]);

  const likeCount = reactionCounts.like || 0;
  const unlikeCount = reactionCounts.unlike || 0;

  return (
      <div className="reactions-container" ref={rootRef}>
        <div className="reaction-counts" role="group" aria-label="Post reactions">
          {reactionOptions.map((option) => {
            const count = option.type === "like" ? likeCount : unlikeCount;

            return (
                <button
                    key={option.type}
                    className={`reaction-chip ${userReaction === option.type ? "active" : ""}`}
                    onClick={() => handleReact(option.type)}
                    title={option.label}
                    aria-label={`${option.label} (${count})`}
                    type="button"
                    disabled={isReacting}
                >
                  <ReactionIcon type={option.type} className="reaction-count-icon" />
                  <span>{count}</span>
                </button>
            );
          })}
        </div>
      </div>
  );
};

export default PostReactions;
