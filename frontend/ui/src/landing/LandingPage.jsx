// LandingPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch("http://localhost:8080/reviews");
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();
        setReviews(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  return (
    <div>
      {/* ================= NAVBAR ================= */}
      <nav className="navbar clean-navbar">
        <div className="logo" onClick={() => window.scrollTo(0, 0)}>
          Uni Learn Hub
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#contact">Contact</a>
          <button className="privacy-btn" onClick={() => setPrivacyOpen(true)}>
            Privacy
          </button>
          <button className="login-btn" onClick={() => navigate("/login")}>
            Login
          </button>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              Learn Smarter, <span>Not Harder</span>
            </h1>
            <p>
              Uni Learn Hub combines modules, video resources, tasks, posts, and reminders 
              to help you improve your life and learning experience.
            </p>
            <button className="get-started-btn" onClick={() => navigate("/signup")}>
              Get Started
            </button>
          </div>
          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
              alt="Study environment"
            />
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="stats-section">
        {[
          { value: "50K+", label: "Active Users" },
          { value: "100+", label: "Modules & Resources" },
          { value: "98%", label: "Satisfaction Rate" },
        ].map((stat, idx) => (
          <div className="stat-box" key={idx}>
            <h2>{stat.value}</h2>
            <h6>{stat.label}</h6>
          </div>
        ))}
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="features-section">
        <h2>Why Learners Love Us</h2>
        <p>Discover the tools that make learning effective and enjoyable</p>
        <div className="features-container">
          {[
            { icon: "📹", title: "Modules & Videos", desc: "Access video resources and modules to learn efficiently." },
            { icon: "✅", title: "Tasks & Achievements", desc: "Create tasks, achieve goals, and improve your productivity." },
            { icon: "⏰", title: "Reminders", desc: "Set reminders to stay on track and improve your life." },
            { icon: "📝", title: "Posts & Questions", desc: "Ask questions, post updates, and interact with other users." },
            { icon: "👥", title: "Admin Panel", desc: "Admins can manage content, review questions, and moderate posts." },
            { icon: "💡", title: "Life Improvement", desc: "Tools and tips to enhance personal growth and learning." },
          ].map((feature, idx) => (
            <div className="feature-card" key={idx}>
              <div className="feature-icon">{feature.icon}</div>
              <h5>{feature.title}</h5>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section id="testimonials" className="testimonials-section">
        <h2>User Reviews</h2>
        <p>Real feedback from our learners</p>
        <div className="reviews-container">
          {loading ? (
            <p>Loading reviews...</p>
          ) : error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : (
            reviews.slice(0, 6).map((review, idx) => (
              <div className="review-card" key={idx}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
                  <div className="review-avatar">
                    {review.username?.charAt(0)}
                  </div>
                  <div>
                    <strong>{review.username}</strong>
                    <div className="rating">{"⭐".repeat(review.rating)}</div>
                  </div>
                </div>
                <p>"{review.comment}"</p>
                <small>{new Date(review.createdAt).toLocaleDateString()}</small>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="footer">
        <div className="footer-container">
          <div>
            <strong>Uni Learn Hub</strong>
            <p className="footer-info">© {new Date().getFullYear()} All rights reserved.</p>
          </div>
          <div className="footer-links">
            <a href="#">Facebook</a>
            <a href="#">Twitter</a>
            <a href="#">LinkedIn</a>
            <a href="#">Instagram</a>
          </div>
          <div>
            <button className="privacy-btn" onClick={() => setPrivacyOpen(true)}>Privacy Policy</button>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </footer>

      {/* ================= CHAT BUTTON ================= */}
      <div className="chat-btn" onClick={() => setDrawerOpen(!drawerOpen)}>
        💬
      </div>

      {drawerOpen && (
        <div className="chat-drawer">
          <h3>Chat</h3>
          <p>This is the chatbot area. Users can chat with support.</p>
        </div>
      )}

      {/* ================= PRIVACY MODAL ================= */}
      {privacyOpen && (
        <div className="privacy-modal" onClick={() => setPrivacyOpen(false)}>
          <div className="privacy-content" onClick={(e) => e.stopPropagation()}>
            <h2>Privacy Policy</h2>
            <p>
              At Uni Learn Hub, we value your privacy. This policy outlines how we collect,
              use, and protect your information. We do not share your personal data with
              third parties without your consent.
            </p>
            <button className="get-started-btn" onClick={() => setPrivacyOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}