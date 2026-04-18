import React from "react";

const RewardUnlockPanel = ({ dashboard }) => {
  if (!dashboard) {
    return null;
  }

  const unlocks = Array.isArray(dashboard.unlocks) ? dashboard.unlocks : [];
  const badges = Array.isArray(dashboard.badges) ? dashboard.badges : [];
  const recentRewards = Array.isArray(dashboard.recentRewards) ? dashboard.recentRewards : [];
  const nextUnlock = unlocks.find((unlock) => !unlock.unlocked);
  const unlockedCount = unlocks.filter((unlock) => unlock.unlocked).length;
  const activeSessionCount = unlocks.filter((unlock) => unlock.activeSession).length;
  const completedTasks = dashboard.completedTasks ?? 0;
  const xpPoints = dashboard.xpPoints ?? 0;
  const getRemainingXp = (unlock) => Math.max((unlock?.requiredXp ?? 0) - xpPoints, 0);

  return (
    <section className="task-card task-reward-panel-shell">
      <div className="section-kicker">Rewards</div>
      <div className="section-head task-reward-panel-head">
        <div>
          <h2>Reward and relax unlock system</h2>
          <p>Complete tasks, gain XP, and unlock each activity when its XP target is reached.</p>
        </div>
        {nextUnlock ? (
          <div className="task-chip">
            Next: {nextUnlock.title}
          </div>
        ) : (
          <div className="task-chip task-chip-success">All features unlocked</div>
        )}
      </div>

      <div className="task-reward-summary">
        <div className="task-reward-summary-card">
          <span>Unlocked modes</span>
          <strong>{unlockedCount}/{unlocks.length}</strong>
        </div>
        <div className="task-reward-summary-card">
          <span>Live sessions</span>
          <strong>{activeSessionCount}</strong>
        </div>
        <div className="task-reward-summary-card">
          <span>Total XP</span>
          <strong>{xpPoints}</strong>
        </div>
        <div className="task-reward-summary-card">
          <span>Completed Tasks</span>
          <strong>{completedTasks}</strong>
        </div>
      </div>

      <div className="task-unlock-grid task-unlock-grid-compact">
        {unlocks.map((unlock) => (
          <article
            key={unlock.id}
            className={`task-unlock-card task-unlock-card-stack ${unlock.unlocked ? "task-unlock-open" : "task-unlock-locked"}`}
          >
            <div className="task-unlock-topline">
              <strong>{unlock.title}</strong>
              <span className={`task-unlock-state-pill ${unlock.unlocked ? "task-unlock-state-pill-open" : ""}`}>
                {unlock.unlocked ? "Unlocked" : "Locked"}
              </span>
            </div>
            <p>{unlock.description}</p>
            <div className="task-requirement-line">
              <span>{unlock.requiredXp} XP</span>
            </div>
            <div className="task-unlock-progress">
              <span>Now: {xpPoints}/{unlock.requiredXp} XP</span>
            </div>
            {!unlock.unlocked ? (
              <div className="task-lock-banner">
                Need {getRemainingXp(unlock)} more XP
              </div>
            ) : (
              <div className="task-lock-banner task-lock-banner-open">
                {unlock.activeSession ? "Relax session active now" : "Ready for a 10 minute relax session"}
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="task-split-panel task-reward-panel-sections">
        <div className="task-reward-subsection">
          <h3>Badges</h3>
          <div className="task-badge-wrap">
            {badges.length === 0 ? (
              <span className="task-chip">No badges yet</span>
            ) : (
              badges.map((badge) => (
                <span className="task-badge" key={badge}>
                  {badge}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="task-reward-subsection">
          <h3>Recent rewards</h3>
          <div className="task-reward-list">
            {recentRewards.length === 0 ? (
              <p className="task-muted">Complete tasks or play an unlocked game to start collecting rewards.</p>
            ) : (
              recentRewards.map((reward) => (
                <div className="task-reward-item" key={reward.id}>
                  <div>
                    <strong>{reward.title}</strong>
                    <p>{reward.description}</p>
                  </div>
                  <span>+{reward.xpAwarded} XP</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RewardUnlockPanel;
