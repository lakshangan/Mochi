import React, { useState } from 'react';
import { GitStatusState, GitCompanionEvent } from '../../shared/types';
import { GitBranch, GitCommit, UploadCloud, Flame, AlertTriangle, Play, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { ConfettiEffect } from './ConfettiEffect';

interface GitCompanionPanelProps {
  status: GitStatusState | null;
  lastEvent: GitCompanionEvent | null;
  onRefresh: () => void;
  onOpenStretches?: () => void;
}

export const GitCompanionPanel: React.FC<GitCompanionPanelProps> = ({
  status,
  lastEvent,
  onRefresh,
  onOpenStretches,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async (type: 'commit' | 'push' | 'fatigue_warning') => {
    setIsSimulating(true);
    if (type === 'commit' || type === 'push') {
      setShowConfetti(true);
    }
    if (window.mochiApi?.simulateGitEvent) {
      await window.mochiApi.simulateGitEvent(type);
    }
    setTimeout(() => {
      setIsSimulating(false);
      onRefresh();
    }, 400);
  };

  const codingMinutes = status?.continuousCodingMinutes ?? 0;
  const progressPercent = Math.min(100, Math.round((codingMinutes / 90) * 100));
  const isFatigueWarning = codingMinutes >= 90 || status?.fatigueWarningActive;

  return (
    <div className="git-companion-container">
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Hero Header */}
      <div className="git-hero-card">
        <div className="git-hero-icon-box">
          <GitBranch size={24} className="git-hero-icon" />
        </div>
        <div className="git-hero-text">
          <div className="git-hero-title-row">
            <h3 className="git-hero-title">Git & Coding Flow Companion</h3>
            <span className="live-status-pill">
              <span className="live-status-dot" /> LIVE WATCHER
            </span>
          </div>
          <p className="git-hero-desc">
            Watches local commits, rewards git pushes, and protects your focus with 90-min fatigue alerts.
          </p>
        </div>
      </div>

      {/* 90-Minute Fatigue Alert Banner */}
      {isFatigueWarning && (
        <div className="git-fatigue-alert-card">
          <div className="fatigue-icon-wrap">
            <AlertTriangle size={24} className="fatigue-icon" />
          </div>
          <div className="fatigue-content">
            <h4 className="fatigue-title">90-Minute Coding Sprint Warning! 🧘‍♂️</h4>
            <p className="fatigue-text">
              You've been in flow state coding for {codingMinutes} minutes straight without moving. Take 30 seconds to stretch your wrists, shoulders, and rest your eyes.
            </p>
            {onOpenStretches && (
              <button onClick={onOpenStretches} className="btn btn-sm btn-primary mt-2">
                Start 30s Guided Stretch ✨
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="git-stats-grid">
        {/* Continuous Flow Streak */}
        <div className="git-stat-card">
          <div className="git-stat-icon-row">
            <span className="stat-label">Continuous Coding Flow</span>
            <Flame size={18} className="flame-icon" />
          </div>
          <div className="stat-big-value">{codingMinutes} <span className="stat-unit">mins</span></div>
          <div className="git-progress-track">
            <div
              className={`git-progress-fill ${isFatigueWarning ? 'danger' : ''}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="git-progress-sub">
            <span>{progressPercent}% towards 90m break</span>
            <span>Target: 90m</span>
          </div>
        </div>

        {/* Commits Today */}
        <div className="git-stat-card">
          <div className="git-stat-icon-row">
            <span className="stat-label">Commits Today</span>
            <GitCommit size={18} className="commit-icon" />
          </div>
          <div className="stat-big-value">{status?.commitsToday ?? 0} <span className="stat-unit">commits</span></div>
          <p className="stat-subtext">
            {status?.commitsToday && status.commitsToday > 0
              ? 'Great momentum today! Keep pushing.'
              : 'Make your first commit to earn +75 XP!'}
          </p>
        </div>

        {/* Current Branch */}
        <div className="git-stat-card">
          <div className="git-stat-icon-row">
            <span className="stat-label">Active Branch</span>
            <GitBranch size={18} className="branch-icon" />
          </div>
          <div className="stat-branch-name">{status?.currentBranch || 'main'}</div>
          <p className="stat-subtext truncate" title={status?.repoPath}>
            {status?.repoPath ? status.repoPath.split('/').slice(-2).join('/') : 'Active Workspace'}
          </p>
        </div>
      </div>

      {/* Last Event / Commit Card */}
      <div className="git-recent-card">
        <div className="git-recent-header">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <h4>Recent Git Activity & Celebration</h4>
          </div>
          {lastEvent && (
            <span className="recent-badge">
              {lastEvent.type.toUpperCase()}
            </span>
          )}
        </div>
        <div className="git-recent-body">
          {lastEvent ? (
            <div className="recent-event-box">
              <Sparkles size={20} className="sparkle-accent" />
              <div>
                <p className="recent-event-msg">{lastEvent.message}</p>
                {lastEvent.data?.shortHash && (
                  <span className="recent-event-hash">#{lastEvent.data.shortHash}</span>
                )}
              </div>
            </div>
          ) : status?.lastCommit ? (
            <div className="recent-event-box">
              <CheckCircle2 size={20} className="check-accent" />
              <div>
                <p className="recent-event-msg">{status.lastCommit.message}</p>
                <span className="recent-event-hash">
                  #{status.lastCommit.shortHash} by {status.lastCommit.author}
                </span>
              </div>
            </div>
          ) : (
            <p className="empty-subtext">No commits detected yet today. Commits and pushes will celebrate here in real-time!</p>
          )}
        </div>
      </div>

      {/* Simulator Playground */}
      <div className="git-simulator-card">
        <div className="simulator-header">
          <h4>Interactive Git Celebration Simulator</h4>
          <p>Test out Mochi's confetti, audio chimes, and fatigue warnings anytime:</p>
        </div>
        <div className="simulator-btn-row">
          <button
            onClick={() => handleSimulate('commit')}
            disabled={isSimulating}
            className="btn btn-sm btn-outline flex items-center gap-1.5"
          >
            <GitCommit size={14} />
            <span>Simulate Commit 🚀 (+75 XP)</span>
          </button>

          <button
            onClick={() => handleSimulate('push')}
            disabled={isSimulating}
            className="btn btn-sm btn-outline flex items-center gap-1.5"
          >
            <UploadCloud size={14} />
            <span>Simulate Push 🌟 (+100 XP)</span>
          </button>

          <button
            onClick={() => handleSimulate('fatigue_warning')}
            disabled={isSimulating}
            className="btn btn-sm btn-outline flex items-center gap-1.5"
          >
            <AlertTriangle size={14} />
            <span>Simulate 90m Warning 🧘</span>
          </button>
        </div>
      </div>
    </div>
  );
};
