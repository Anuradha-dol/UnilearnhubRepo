import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import logo from "../assets/logo.png";
import "../pages/Home.css";

const userNavItems = [
  { label: "Profile", path: "/profile" },
  { label: "Resources", path: "/resources" },
  { label: "Support", path: "/SupportUser" },
  { label: "Review", path: "/Review" },
  { label: "Tasks", path: "/taskPage" },
];

export default function Review() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState("positive");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load the user's review list when the page opens.
  useEffect(() => {
    fetchMyReviews();
  }, []);

  // Get the current user's reviews from the server.
  const fetchMyReviews = async () => {
    try {
      const res = await api.get("/reviews/gets", { withCredentials: true });
      setReviews(res.data);
    } catch (err) {
      setError(err.response?.status === 403 ? "Not authorized" : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  // Save a new review, or update the one the user is editing.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return setError("Comment cannot be empty");
    setError("");

    try {
      if (editingId) {
        const res = await api.put(`/reviews/${editingId}`, { comment, rating, status }, { withCredentials: true });
        setReviews((prev) => prev.map((r) => (r.id === editingId ? res.data : r)));
      } else {
        const res = await api.post("/reviews", { comment, rating, status }, { withCredentials: true });
        setReviews((prev) => [res.data, ...prev]);
      }
      resetForm();
    } catch (err) {
      setError(err.response?.status === 403 ? "You can only modify your own reviews" : "Failed to save review");
    }
  };

  // Remove one review after the user confirms it.
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/reviews/${id}`, { withCredentials: true });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Failed to delete");
    }
  };

  // Put the selected review back into the form for editing.
  const handleEdit = (review) => {
    setEditingId(review.id);
    setComment(review.comment);
    setRating(review.rating);
    setStatus(review.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset the form after save or cancel.
  const resetForm = () => {
    setEditingId(null);
    setComment("");
    setRating(5);
    setStatus("positive");
    setError("");
  };

  if (loading) return (
      <div className="modern-home-page flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#e8e4db] border-t-[#b49060] animate-spin"></div>
          <p className="text-[#827a71] font-medium tracking-wide">Loading reviews...</p>
        </div>
      </div>
  );

  return (
      <div className="modern-home-page">
        <div className="light-bg-gradient" />
        <div className="grain-overlay" />
        <div className="color-ribbon color-ribbon-1" />
        <div className="color-ribbon color-ribbon-2" />
        <div className="color-ribbon color-ribbon-3" />
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />
        <div className="glow-orb glow-orb-3" />

        <main className="site-shell pt-6 pb-8 min-h-screen flex flex-col gap-6 animate-in" style={{ animationDelay: '100ms' }}>
          <header className="premium-glass top-nav-shell rounded-full px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer" onClick={() => navigate("/home")}>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-lg shadow-[#5f3920]/20 transition-all duration-300">
                <img src={logo} alt="Uni Learn Hub logo" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight leading-tight">
                  Uni Learn Hub
                </h1>
                <p className="text-xs font-semibold uppercase tracking-widest">
                  Review Space
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-2 lg:gap-3">
              {userNavItems.map((item) => (
                  <button
                      key={item.label}
                      className="nav-pill text-xs sm:text-sm"
                      onClick={() => navigate(item.path)}
                      type="button"
                  >
                    <span>{item.label}</span>
                  </button>
              ))}
            </nav>
          </header>

          <div className="flex justify-between items-center mb-2">
            <h2 className="text-3xl font-extrabold text-[#2d2926] flex items-center gap-3">
              <svg className="w-8 h-8 text-[#b49060]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Community Reviews
            </h2>
            <button
                onClick={() => navigate("/home")}
                className="px-5 py-2 rounded-full bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:text-[#b49060] transition-colors"
            >
              Back to Home
            </button>
          </div>

          {error && (
              <div className="p-4 rounded-xl bg-[#fcf1ef] text-[#c36254] border border-[#f0c3be] text-sm font-bold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
          )}

          <div className="premium-glass rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#b49060]/10 to-transparent rounded-bl-full pointer-events-none"></div>
            <h3 className="text-xl font-bold text-[#2d2926] mb-5">{editingId ? "Edit Your Review" : "Share Your Experience"}</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
            <textarea
                className="w-full min-h-[120px] p-4 rounded-2xl bg-white border border-[#e8e4db] text-[#2d2926] text-sm placeholder-[#a39c93] focus:outline-none focus:ring-2 focus:ring-[#b49060]/30 shadow-inner resize-y custom-scrollbar"
                placeholder="What do you think about our resources and tools?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            />

              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full border border-[#e8e4db]">
                  <label className="text-xs font-bold text-[#827a71] uppercase tracking-wider">Rating</label>
                  <input
                      type="number"
                      min="1"
                      max="5"
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-12 text-center text-[#2d2926] font-bold outline-none bg-transparent"
                  />
                  <span className="text-[#b49060]">★</span>
                </div>

                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full border border-[#e8e4db]">
                  <label className="text-xs font-bold text-[#827a71] uppercase tracking-wider">Sentiment</label>
                  <select
                      className="text-[#2d2926] font-bold outline-none bg-transparent cursor-pointer"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negative</option>
                  </select>
                </div>

                <div className="flex-1 flex justify-end gap-3 mt-2 sm:mt-0">
                  {editingId && (
                      <button
                          type="button"
                          className="px-6 py-2.5 rounded-full bg-white text-[#5c544d] border border-[#e8e4db] font-bold text-sm shadow-sm hover:bg-[#faf5eb] transition-colors"
                          onClick={resetForm}
                      >
                        Cancel
                      </button>
                  )}
                  <button
                      type="submit"
                      className="px-8 py-2.5 rounded-full bg-gradient-to-r from-[#b49060] to-[#876d47] text-white font-bold text-sm shadow-[0_4px_10px_rgba(180,144,96,0.3)] hover:-translate-y-0.5 transition-transform"
                  >
                    {editingId ? "Update Review" : "Post Review"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="mt-4">
            <h3 className="text-xl font-bold text-[#2d2926] mb-5 ml-2">Recent Testimonials</h3>
            <div className="grid grid-cols-1 gap-5">
              {reviews.length === 0 ? (
                  <div className="text-center py-10 bg-white/40 rounded-3xl border border-[#e8e4db] backdrop-blur-sm">
                    <p className="text-[#827a71] font-medium">Be the first to share your experience!</p>
                  </div>
              ) : (
                  reviews.map((r, idx) => (
                      <div
                          key={r.id}
                          className="premium-glass rounded-3xl p-6 relative animate-in hover:-translate-y-1 transition-transform duration-300"
                          style={{ animationDelay: `${200 + (idx % 10) * 50}ms` }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-[#b49060] to-[#876d47] p-0.5 shadow-sm">
                              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-lg font-bold text-[#2d2926]">
                                {r.username ? r.username[0].toUpperCase() : 'U'}
                              </div>
                            </div>
                            <div>
                              <div className="font-bold text-[#2d2926]">{r.username}</div>
                              <div className="text-xs font-medium text-[#827a71]">{new Date(r.createdAt).toLocaleString(undefined, {dateStyle: 'medium'})}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                       <span className="flex items-center text-[#b49060] font-bold bg-[#faf5eb] px-2.5 py-1 rounded-full text-xs border border-[#e8e4db]">
                         {r.rating} <span className="ml-1">★</span>
                       </span>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                r.status === 'positive' ? 'bg-[#ebf5ed] text-[#6f917e] border-[#cce4d2]' :
                                    r.status === 'negative' ? 'bg-[#fcf1ef] text-[#c36254] border-[#f0c3be]' :
                                        'bg-[#f1efe9] text-[#827a71] border-[#d4cebd]'
                            }`}>
                         {r.status}
                       </span>
                          </div>
                        </div>

                        <p className="text-[#5c544d] text-sm leading-relaxed mb-4 pl-1">{r.comment}</p>

                        <div className="flex justify-end gap-2 pt-4 border-t border-[#e8e4db]/50">
                          <button
                              className="px-4 py-1.5 rounded-full bg-white text-[#876d47] border border-[#e8e4db] text-xs font-bold hover:bg-[#faf5eb] transition-colors"
                              onClick={() => handleEdit(r)}
                          >
                            Edit
                          </button>
                          <button
                              className="px-4 py-1.5 rounded-full bg-white text-[#c36254] border border-[#e8e4db] text-xs font-bold hover:bg-[#fcf1ef] transition-colors"
                              onClick={() => handleDelete(r.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                  ))
              )}
            </div>
          </div>

        </main>
      </div>
  );
}
