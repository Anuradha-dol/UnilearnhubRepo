import { useEffect, useState } from "react";
import api from "../api";
import "./SupportAdmin.css";

export default function SupportAdmin() {
  const [questions, setQuestions] = useState([]);
  const [responseText, setResponseText] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAllQuestions();
  }, []);

  const fetchAllQuestions = async () => {
    try {
      const res = await api.get("/support", { withCredentials: true });
      setQuestions(res.data);
    } catch {
      setError("Failed to load questions");
    }
  };

  const handleRespond = async (id) => {
    if (!responseText[id]?.trim()) return;
    try {
      const res = await api.put(`/support/${id}/respond`, { response: responseText[id] }, { withCredentials: true });
      setQuestions(questions.map((q) => (q.id === id ? res.data : q)));
      setResponseText({ ...responseText, [id]: "" });
    } catch {
      setError("Failed to respond");
    }
  };

  const getStatusInfo = (status) => {
    const upper = status?.toUpperCase() || "OPEN";
    switch (upper) {
      case "ANSWERED":
        return { label: "Answered", color: "#2e7d32" };
      case "CLOSED":
        return { label: "Closed", color: "#757575" };
      default:
        return { label: "Open", color: "#b76e00" };
    }
  };

  return (
    <div className="support-container">
      <div className="support-header">
        <div className="support-header-avatar">Q</div>
        <div>
          <h1 className="support-header-title">Support Inbox</h1>
          <p className="support-header-subtitle">
            {questions.length} conversation{questions.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {error && <div className="support-error">{error}</div>}

      {questions.length === 0 && !error ? (
        <div className="no-questions">
          <h3>No questions yet.</h3>
          <p>New questions will appear here.</p>
        </div>
      ) : (
        <div className="chat-container">
          {questions.map((q) => {
            const status = getStatusInfo(q.status);
            return (
              <div key={q.id}>
            
                <div className="user-message-wrapper">
                  <div className="user-avatar">U</div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                      <strong>{q.username}</strong>
                      <span className="status-badge" style={{ color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                    <div className="message-bubble user">{q.question}</div>
                  </div>
                </div>

              
                {q.adminResponse ? (
                  <div className="admin-response-wrapper">
                    <div className="admin-message-content">
                      <div className="message-bubble admin" style={{ color: "#0077b6" }}>
                        {q.adminResponse}
                      </div>
                    </div>
                    <div className="admin-avatar">A</div>
                  </div>
                ) : (
                  <div className="response-input-wrapper">
                    <input
                      className="response-input"
                      placeholder="Type your reply..."
                      value={responseText[q.id] || ""}
                      onChange={(e) => setResponseText({ ...responseText, [q.id]: e.target.value })}
                    />
                    <button
                      className="send-button"
                      onClick={() => handleRespond(q.id)}
                      disabled={!responseText[q.id]?.trim()}
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}