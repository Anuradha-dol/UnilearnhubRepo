import React, { useEffect, useState } from "react";
import api from "../api";
import "./PostReactions.css";

const reactionTypes = ["like", "love", "care", "haha", "wow", "sad", "angry"];
const reactionEmojis = {
  like: "👍",
  love: "❤️",
  care: "🤗",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😡",
};

const PostReactions = ({ postId }) => {
  const [reactionCounts, setReactionCounts] = useState({});
  const [userReaction, setUserReaction] = useState(null);
  const [showReactions, setShowReactions] = useState(false);

  const fetchReactions = async () => {
    try {
      const res = await api.get(`/reactions/${postId}/counts`, { withCredentials: true });
      setReactionCounts(res.data);
      if (res.data.userReaction) {
        setUserReaction(res.data.userReaction);
      }
    } catch (err) {
      console.error("Error fetching reactions:", err);
    }
  };

  const handleReact = async (type) => {
    try {
      await api.post(`/reactions/${postId}`, null, { params: { type }, withCredentials: true });
      setUserReaction(type);
      fetchReactions();
      setShowReactions(false); // hide popover only after selecting an emoji
    } catch (err) {
      console.error("Error reacting:", err);
      if (err.response && (err.response.status === 403 || err.response.status === 401)) {
        alert("You are not authorized. Please log in.");
      } else {
        alert("Failed to react. Please try again.");
      }
    }
  };

  useEffect(() => {
    fetchReactions();
  }, [postId]);

  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="reactions-container">
      {/* Reaction counts */}
      <div className="reaction-counts">
        {reactionTypes
          .filter((type) => (reactionCounts[type] || 0) > 0)
          .map((type) => (
            <span key={type}>
              {reactionEmojis[type]} {reactionCounts[type] || 0}
            </span>
          ))}
        {totalReactions > 0 && <span>Total: {totalReactions}</span>}
      </div>

      {/* Reaction button */}
      <div className="reaction-button-wrapper">
        <button
          className="reaction-button"
          onClick={() => setShowReactions((prev) => !prev)}
        >
          {userReaction ? reactionEmojis[userReaction] : "👍"}
        </button>

        {/* Popover */}
        {showReactions && (
          <div className="reaction-popover">
            {reactionTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleReact(type)} // hide popover inside handleReact
              >
                {reactionEmojis[type]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostReactions;