import { useEffect, useState } from "react";
import api from "../api";
import "./Review.css";

export default function Review() {
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState("positive");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchMyReviews();
  }, []);

  const fetchMyReviews = async () => {
    try {
      const res = await api.get("/reviews/gets", { withCredentials: true });
      setReviews(res.data);
    } catch (err) {
      setError(err.response?.status === 403 ? "Not authorized" : "Failed to load reviews");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return setError("Comment cannot be empty");

    try {
      if (editingId) {
        const res = await api.put(`/reviews/${editingId}`, { comment, rating, status }, { withCredentials: true });
        setReviews((prev) => prev.map((r) => (r.id === editingId ? res.data : r)));
        alert("Updated ");
      } else {
        const res = await api.post("/reviews", { comment, rating, status }, { withCredentials: true });
        setReviews((prev) => [res.data, ...prev]);
        alert("Added ");
      }
      resetForm();
    } catch (err) {
      setError(err.response?.status === 403 ? "You can only modify your own reviews" : "Failed to save review");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/reviews/${id}`, { withCredentials: true });
      setReviews((prev) => prev.filter((r) => r.id !== id));
      alert("Deleted ");
    } catch {
      setError("Failed to delete");
    }
  };

  const handleEdit = (review) => {
    setEditingId(review.id);
    setComment(review.comment);
    setRating(review.rating);
    setStatus(review.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setComment("");
    setRating(5);
    setStatus("positive");
  };

  const getStatusClass = (status) => {
    if (status === "positive") return "status-positive";
    if (status === "neutral") return "status-neutral";
    return "status-negative";
  };

  return (
    <div className="review-container">
      <h2 className="review-header">{editingId ? "Edit Review" : "Share Your Feedback"}</h2>

      {error && <div className="review-error">{error}</div>}

   
      <div className="review-form-card">
        <form onSubmit={handleSubmit}>
          <textarea
            className="review-textarea"
            placeholder="Write your review..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="review-controls">
            <input
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="review-select"
            />
            <select className="review-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
          <div className="review-buttons">
            <button type="submit" className="review-button review-submit">
              {editingId ? "Update" : "Submit"}
            </button>
            {editingId && (
              <button type="button" className="review-button review-cancel" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

  
      <div className="review-list">
        {reviews.length === 0 ? (
          <div className="review-card">No reviews yet.</div>
        ) : (
          reviews.map((r) => (
            <div className="review-card" key={r.id}>
              <div className="review-card-header">
                <div className="review-avatar">{r.username[0].toUpperCase()}</div>
                <div>
                  <div className="review-username">{r.username}</div>
                  <div className="review-date">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="review-comment">{r.comment}</div>
              <div className="review-footer">
                <div>Rating: {r.rating}</div>
                <div className={`review-status ${getStatusClass(r.status)}`}>{r.status}</div>
              </div>
              <div className="review-actions">
                <button className="review-action-button review-edit" onClick={() => handleEdit(r)}>Edit</button>
                <button className="review-action-button review-delete" onClick={() => handleDelete(r.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}