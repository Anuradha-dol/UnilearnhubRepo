import React, { useEffect, useState } from "react";
import api from "../api";

const formatTimeLeft = (expiresAt) => {
  if (!expiresAt) {
    return "10:00";
  }
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) {
    return "00:00";
  }
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const SubjectQuizGame = ({ unlock, onRefresh, dashboard }) => {
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(formatTimeLeft(unlock?.sessionExpiresAt));

  useEffect(() => {
    setTimeLeft(formatTimeLeft(session?.expiresAt || unlock?.sessionExpiresAt));
    const interval = window.setInterval(() => {
      setTimeLeft(formatTimeLeft(session?.expiresAt || unlock?.sessionExpiresAt));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [session?.expiresAt, unlock?.sessionExpiresAt]);

  const currentQuestion = questions[currentIndex];
  const isLocked = !unlock?.unlocked;
  const isExpired = timeLeft === "00:00";
  const hasAnsweredAll = questions.length > 0 && Object.keys(answers).length === questions.length;
  const remainingXp = Math.max((unlock?.requiredXp ?? 0) - (dashboard?.xpPoints ?? 0), 0);

  const headline = unlock?.feature === "ADVANCED_GAME" ? "Advanced puzzle challenge" : "Mini puzzle challenge";

  const startGame = async () => {
    if (isLocked) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);
      const sessionResponse = await api.post(`/tasks/games/${unlock.feature}/session`);
      const questionsResponse = await api.get("/tasks/games/subject-quiz", {
        params: { feature: unlock.feature },
      });
      setSession(sessionResponse.data);
      setQuestions(Array.isArray(questionsResponse.data) ? questionsResponse.data : []);
      setCurrentIndex(0);
      setAnswers({});
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to start the quiz right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, selectedOption) => {
    setAnswers((current) => ({ ...current, [questionId]: selectedOption }));
  };

  const goNext = () => {
    setCurrentIndex((index) => Math.min(index + 1, questions.length - 1));
  };

  const goBack = () => {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  };

  const submitQuiz = async () => {
    try {
      setLoading(true);
      setError("");
      const payload = {
        answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
          questionId: Number(questionId),
          selectedOption,
        })),
      };
      const response = await api.post("/tasks/games/subject-quiz/submit", payload, {
        params: { feature: unlock.feature },
      });
      setResult(response.data);
      await onRefresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to submit the quiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="task-card task-game-card">
      <div className="section-kicker">Subject Game</div>
      <div className="section-head">
        <div>
          <h2>{headline}</h2>
          <p>{unlock?.description}</p>
        </div>
        <div className={`task-chip ${unlock?.unlocked ? "task-chip-success" : ""}`}>
          {unlock?.unlocked ? `Time left ${timeLeft}` : "Locked"}
        </div>
      </div>

      {isLocked ? (
        <div className="task-lock-banner">
          Need {remainingXp} more XP to unlock this game.
        </div>
      ) : (
        <>
          {!questions.length ? (
            <div className="task-game-empty">
              <p>One puzzle at a time. Score well for an XP bonus before the 10 minute relax window closes.</p>
              <button className="task-primary-btn" disabled={loading} onClick={startGame} type="button">
                {loading ? "Loading..." : "Start Quiz"}
              </button>
            </div>
          ) : (
            <div className="task-quiz-shell">
              {isExpired ? (
                <div className="task-lock-banner">Relax time is over. Return to your tasks.</div>
              ) : null}

              {currentQuestion ? (
                <>
                  <div className="task-question-meta">
                    <span>Question {currentIndex + 1} / {questions.length}</span>
                    <span>{headline}</span>
                  </div>
                  <h3>{currentQuestion.prompt}</h3>
                  <div className="task-option-grid">
                    {currentQuestion.options.map((option, index) => {
                      const selected = answers[currentQuestion.questionId] === index;
                      return (
                        <button
                          className={`task-option-btn ${selected ? "task-option-btn-active" : ""}`}
                          disabled={isExpired}
                          key={`${currentQuestion.questionId}-${option}`}
                          onClick={() => handleAnswer(currentQuestion.questionId, index)}
                          type="button"
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  <div className="task-game-actions">
                    <button className="task-secondary-btn" onClick={goBack} type="button">
                      Previous
                    </button>
                    {currentIndex < questions.length - 1 ? (
                      <button className="task-secondary-btn" onClick={goNext} type="button">
                        Next
                      </button>
                    ) : (
                      <button
                        className="task-primary-btn"
                        disabled={!hasAnsweredAll || loading || isExpired}
                        onClick={submitQuiz}
                        type="button"
                      >
                        {loading ? "Submitting..." : "Submit Quiz"}
                      </button>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </>
      )}

      {result ? (
        <div className="task-result-card">
          <strong>Quiz result</strong>
          <p>{result.feedback}</p>
          <div className="task-result-meta">
            <span>Score: {result.score}/{result.totalQuestions}</span>
            <span>Bonus: +{result.xpBonus} XP</span>
          </div>
        </div>
      ) : null}

      {error ? <p className="task-inline-error">{error}</p> : null}
    </article>
  );
};

export default SubjectQuizGame;
