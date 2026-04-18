import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import api from "../api";
import logo from "../assets/logo.png";
import LandingChatbot from "./LandingChatbot";

const STATS = [
  { value: "50K+", label: "Active Users" },
  { value: "100+", label: "Modules & Resources" },
  { value: "98%", label: "Satisfaction Rate" },
];

const FEATURES = [
  {
    tag: "01",
    title: "Modules & Videos",
    description: "Access video resources and modules to learn efficiently.",
  },
  {
    tag: "02",
    title: "Tasks & Achievements",
    description: "Create tasks, achieve goals, and improve your productivity.",
  },
  {
    tag: "03",
    title: "Reminders",
    description: "Set reminders to stay on track and improve your life.",
  },
  {
    tag: "04",
    title: "Posts & Questions",
    description: "Ask questions, post updates, and interact with other users.",
  },
  {
    tag: "05",
    title: "Admin Panel",
    description: "Admins can manage content, review questions, and moderate posts.",
  },
  {
    tag: "06",
    title: "Life Improvement",
    description: "Tools and tips to enhance personal growth and learning.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchReviews = async () => {
      try {
        const response = await api.get("/reviews");
        if (!ignore) {
          setReviews(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || err.message || "Failed to fetch reviews");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="landing-shell">
      <nav className="navbar clean-navbar">
        <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <img src={logo} alt="Uni Learn Hub logo" className="logo-mark" />
          <span>Uni Learn Hub</span>
        </div>
        <div className="nav-links">
          <div className="nav-links__items">
            <a href="#features">Features</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#contact">Contact</a>
            <button type="button" className="privacy-btn" onClick={() => setPrivacyOpen(true)}>
              Privacy
            </button>
          </div>
          <div className="nav-links__actions">
            <button type="button" className="login-btn" onClick={() => navigate("/login")}>
              Login
            </button>
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              Learn Smarter, <span>Not Harder</span>
            </h1>
            <p>
              Uni Learn Hub combines modules, video resources, tasks, posts, and reminders to
              help you improve your life and learning experience.
            </p>
            <button type="button" className="get-started-btn" onClick={() => navigate("/signup")}>
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

      <section className="stats-section">
        {STATS.map((stat) => (
          <div className="stat-box" key={stat.label}>
            <h2>{stat.value}</h2>
            <h6>{stat.label}</h6>
          </div>
        ))}
      </section>

      <section id="features" className="features-section">
        <h2>Why Learners Love Us</h2>
        <p>Discover the tools that make learning effective and enjoyable</p>
        <div className="features-container">
          {FEATURES.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <div className="feature-icon">{feature.tag}</div>
              <h5>{feature.title}</h5>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="testimonials" className="testimonials-section">
        <h2>User Reviews</h2>
        <p>Real feedback from our learners</p>
        <div className="reviews-container">
          {loading ? (
            <p className="review-state">Loading reviews...</p>
          ) : error ? (
            <p className="review-state review-state--error">{error}</p>
          ) : reviews.length === 0 ? (
            <p className="review-state">No reviews available yet.</p>
          ) : (
            reviews.slice(0, 6).map((review, index) => (
              <div className="review-card" key={`${review.id || review.username}-${index}`}>
                <div className="review-card__header">
                  <div className="review-avatar">{(review.username || "U").charAt(0)}</div>
                  <div>
                    <strong>{review.username || "Learner"}</strong>
                    <div className="rating">Rating {Number(review.rating || 0)}/5</div>
                  </div>
                </div>
                <p>"{review.comment}"</p>
                <small>
                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Recent"}
                </small>
              </div>
            ))
          )}
        </div>
      </section>

      <footer id="contact" className="footer">
        <div className="footer-container">
          <div>
            <strong>Uni Learn Hub</strong>
            <p className="footer-info">{new Date().getFullYear()} All rights reserved.</p>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#contact">Contact</a>
          </div>
          <div>
            <button type="button" className="privacy-btn footer-privacy-btn" onClick={() => setPrivacyOpen(true)}>
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      {chatOpen ? (
        <div className="chat-panel">
          <LandingChatbot compact onClose={() => setChatOpen(false)} />
        </div>
      ) : null}

      <button
        type="button"
        className={`chat-fab ${chatOpen ? "chat-fab--active" : ""}`}
        onClick={() => setChatOpen((current) => !current)}
        aria-label="Open chatbot"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5.5C4 4.12 5.12 3 6.5 3h11C18.88 3 20 4.12 20 5.5v7C20 13.88 18.88 15 17.5 15H10l-4.2 3.5c-.33.27-.8.04-.8-.39V15.9C4.41 15.58 4 15.08 4 14.5v-9z" />
        </svg>
      </button>

      {privacyOpen ? (
        <div className="privacy-modal" onClick={() => setPrivacyOpen(false)}>
          <div className="privacy-content" onClick={(event) => event.stopPropagation()}>
            <h2>Privacy Policy</h2>
            <p>
              At Uni Learn Hub, we value your privacy. This policy outlines how we collect, use,
              and protect your information. We do not share your personal data with third parties
              without your consent.
            </p>
            <button type="button" className="get-started-btn" onClick={() => setPrivacyOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
