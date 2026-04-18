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

const BusinessGame = ({ unlock, onRefresh, dashboard }) => {
  const [session, setSession] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(formatTimeLeft(unlock?.sessionExpiresAt));
  const remainingXp = Math.max((unlock?.requiredXp ?? 0) - (dashboard?.xpPoints ?? 0), 0);

  useEffect(() => {
    setTimeLeft(formatTimeLeft(session?.expiresAt || unlock?.sessionExpiresAt));
    const interval = window.setInterval(() => {
      setTimeLeft(formatTimeLeft(session?.expiresAt || unlock?.sessionExpiresAt));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [session?.expiresAt, unlock?.sessionExpiresAt]);

  const startScenario = async () => {
    if (!unlock?.unlocked) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);
      const sessionResponse = await api.post(`/tasks/games/${unlock.feature}/session`);
      const scenarioResponse = await api.get("/tasks/games/business-simulation");
      setSession(sessionResponse.data);
      setScenario(scenarioResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load the business scenario.");
    } finally {
      setLoading(false);
    }
  };

  const submitDecision = async (optionId) => {
    if (!scenario) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await api.post("/tasks/games/business-simulation/submit", {
        scenarioId: scenario.scenarioId,
        optionId,
      });
      setResult(response.data);
      await onRefresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to submit that decision.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="task-card task-game-card">
      <div className="section-kicker">Business Game</div>
      <div className="section-head">
        <div>
          <h2>Decision-making simulation</h2>
          <p>{unlock?.description}</p>
        </div>
        <div className={`task-chip ${unlock?.unlocked ? "task-chip-success" : ""}`}>
          {unlock?.unlocked ? `Time left ${timeLeft}` : "Locked"}
        </div>
      </div>

      {!unlock?.unlocked ? (
        <div className="task-lock-banner">
          Need {remainingXp} more XP to unlock this game.
        </div>
      ) : !scenario ? (
        <div className="task-game-empty">
          <p>Choose a strategy, see the result, and earn a business bonus if your decision is strong.</p>
          <button className="task-primary-btn" disabled={loading} onClick={startScenario} type="button">
            {loading ? "Loading..." : "Start Simulation"}
          </button>
        </div>
      ) : (
        <div className="task-quiz-shell">
          {timeLeft === "00:00" ? (
            <div className="task-lock-banner">Relax time is over. Return to your tasks.</div>
          ) : null}
          <div className="task-question-meta">
            <span>Scenario</span>
            <span>{scenario.title}</span>
          </div>
          <h3>{scenario.prompt}</h3>
          <div className="task-option-grid">
            {scenario.options.map((option) => (
              <button
                className="task-option-btn"
                disabled={loading || timeLeft === "00:00" || !!result}
                key={option.optionId}
                onClick={() => submitDecision(option.optionId)}
                type="button"
              >
                <strong>{option.label}</strong>
                <span>{option.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {result ? (
        <div className="task-result-card">
          <strong>Simulation result</strong>
          <p>{result.result}</p>
          <div className="task-result-meta">
            <span>Decision score: {result.score}</span>
            <span>Bonus: +{result.xpBonus} XP</span>
          </div>
          <p className="task-muted">{result.recommendation}</p>
        </div>
      ) : null}

      {error ? <p className="task-inline-error">{error}</p> : null}
    </article>
  );
};

export default BusinessGame;
