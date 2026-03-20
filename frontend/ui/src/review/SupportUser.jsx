import { useEffect, useState } from "react";
import "./SupportUser.css";

export default function SupportUser() {
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState("");
  const [error, setError] = useState("");

 
  const BASE_URL = "http://localhost:8080/support";

  useEffect(() => {
    fetchMyQuestions();
  }, []);

  const fetchMyQuestions = async () => {
    try {
      const res = await fetch(`${BASE_URL}/my`, {
        method: "GET",
        credentials: "include", 
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        if (res.status === 403) setError("Access denied. Please login.");
        else throw new Error("Failed to fetch");
      } else {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      setError("Failed to load questions");
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    try {
      const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question: questionText }),
      });

      if (!res.ok) {
        if (res.status === 403) setError("Access denied. Please login.");
        else throw new Error("Failed to submit");
      } else {
        const data = await res.json();
        setQuestions([data, ...questions]);
        setQuestionText("");
        setError("");
      }
    } catch (err) {
      setError("Failed to submit question");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      const res = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      setQuestions(questions.filter((q) => q.id !== id));
      setError("");
    } catch {
      setError("Failed to delete");
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
        <div className="support-avatar">Q</div>
        <div>
          <h1>My Support</h1>
          <p>{questions.length} conversation{questions.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="form-container">
        <h3>Ask a new question</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type your question here..."
          />
          <button type="submit">Submit</button>
        </form>
      </div>

      {questions.length === 0 && !error ? (
        <div className="no-questions">You haven't asked any questions yet.</div>
      ) : (
        <div className="chat-container">
          {questions.map((q) => {
            const status = getStatusInfo(q.status);
            return (
              <div key={q.id}>
             
                <div className="user-bubble-wrapper">
                  <div className="user-bubble">
                    <div className="user-bubble-content">
                      {q.question}
                      <div className="user-bubble-footer">
                        <span>{new Date(q.createdAt).toLocaleTimeString()}</span>
                        <button className="delete-button" onClick={() => handleDelete(q.id)}>Delete</button>
                      </div>
                    </div>
                    <div className="user-avatar">U</div>
                  </div>
                </div>

          
                {q.adminResponse && (
                  <div className="admin-bubble-wrapper">
                    <div className="admin-avatar">A</div>
                    <div className="admin-bubble-content">
                      <div className="admin-response">{q.adminResponse}</div>
                      <div className="admin-status" style={{ color: status.color }}>
                        <span>{status.label}</span>
                        <span className="admin-timestamp">{new Date(q.updatedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
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