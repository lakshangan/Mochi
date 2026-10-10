import React, { useState } from 'react';
import { ActiveTimerState, PomodoroPhase } from '../../shared/types';
import { Play, Pause, RotateCcw, FastForward, Bell, Flame, Coffee, Moon } from 'lucide-react';

interface TimerPanelProps {
  timer: ActiveTimerState;
  pomodoroSessions: number;
  onStartTimer: (seconds: number, label?: string) => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onResetTimer: () => void;
  onStartPomodoro: (phase?: PomodoroPhase) => void;
  onSkipPomodoro: () => void;
}

export const TimerPanel: React.FC<TimerPanelProps> = ({
  timer,
  pomodoroSessions,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onStartPomodoro,
  onSkipPomodoro,
}) => {
  const [activeTab, setActiveTab] = useState<'countdown' | 'pomodoro'>('countdown');
  const [customMinutes, setCustomMinutes] = useState(15);
  const [timerLabel, setTimerLabel] = useState('Deep Work');

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent =
    timer.totalDurationSeconds > 0
      ? Math.max(0, Math.min(100, (1 - timer.remainingSeconds / timer.totalDurationSeconds) * 100))
      : 0;

  return (
    <div className="panel-container">
      {/* Sub-tabs */}
      <div className="tab-pill-group">
        <button
          className={`tab-pill ${activeTab === 'countdown' ? 'active' : ''}`}
          onClick={() => setActiveTab('countdown')}
        >
          <Bell size={14} /> Countdown Timer
        </button>
        <button
          className={`tab-pill ${activeTab === 'pomodoro' ? 'active' : ''}`}
          onClick={() => setActiveTab('pomodoro')}
        >
          <Flame size={14} /> Pomodoro
        </button>
      </div>

      {/* Main Digital Clock Display */}
      <div className="timer-hero-display">
        <div className="timer-circle-wrap">
          <svg className="timer-svg" viewBox="0 0 160 160">
            <circle className="timer-track" cx="80" cy="80" r="70" />
            <circle
              className="timer-progress"
              cx="80"
              cy="80"
              r="70"
              strokeDasharray={440}
              strokeDashoffset={440 - (440 * progressPercent) / 100}
            />
          </svg>
          <div className="timer-center-content">
            <div className="timer-digits">
              {timer.status === 'stopped'
                ? formatTime(customMinutes * 60)
                : formatTime(timer.remainingSeconds)}
            </div>
            <div className="timer-status-badge">
              {timer.mode === 'pomodoro'
                ? timer.pomodoroPhase.replace('-', ' ').toUpperCase()
                : timer.status.toUpperCase()}
            </div>
          </div>
        </div>

        {timer.label && <div className="timer-current-label">{timer.label}</div>}
      </div>

      {/* Controls Bar */}
      <div className="timer-controls-row">
        {timer.status === 'running' ? (
          <button className="btn btn-warning" onClick={onPauseTimer} title="Pause">
            <Pause size={18} /> Pause
          </button>
        ) : timer.status === 'paused' ? (
          <button className="btn btn-primary" onClick={onResumeTimer} title="Resume">
            <Play size={18} /> Resume
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => {
              if (activeTab === 'pomodoro') {
                onStartPomodoro('focus');
              } else {
                onStartTimer(customMinutes * 60, timerLabel);
              }
            }}
          >
            <Play size={18} /> Start
          </button>
        )}

        <button
          className="btn btn-secondary"
          onClick={onResetTimer}
          disabled={timer.status === 'stopped'}
          title="Reset"
        >
          <RotateCcw size={16} /> Reset
        </button>

        {timer.mode === 'pomodoro' && timer.status !== 'stopped' && (
          <button className="btn btn-outline" onClick={onSkipPomodoro} title="Skip to next session">
            <FastForward size={16} /> Skip
          </button>
        )}
      </div>

      {/* Mode-specific configuration */}
      {activeTab === 'countdown' ? (
        <div className="timer-presets-section">
          <div className="section-title">Quick Presets</div>
          <div className="preset-chips">
            {[5, 10, 15, 25, 45, 60].map((mins) => (
              <button
                key={mins}
                className={`preset-chip ${customMinutes === mins ? 'selected' : ''}`}
                onClick={() => {
                  setCustomMinutes(mins);
                  onStartTimer(mins * 60, `${mins}m Timer`);
                }}
              >
                {mins}m
              </button>
            ))}
          </div>

          <div className="custom-input-row">
            <label>Custom (mins):</label>
            <input
              type="number"
              min="1"
              max="240"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
              className="number-input"
            />
            <input
              type="text"
              placeholder="Label (e.g. Reading)"
              value={timerLabel}
              onChange={(e) => setTimerLabel(e.target.value)}
              className="text-input"
            />
          </div>
        </div>
      ) : (
        <div className="pomodoro-section">
          <div className="pomodoro-modes-grid">
            <button
              className={`pomo-phase-card ${timer.pomodoroPhase === 'focus' ? 'active' : ''}`}
              onClick={() => onStartPomodoro('focus')}
            >
              <Flame size={20} className="icon-flame" />
              <div className="pomo-name">Focus</div>
              <div className="pomo-desc">25 mins</div>
            </button>
            <button
              className={`pomo-phase-card ${
                timer.pomodoroPhase === 'short-break' ? 'active' : ''
              }`}
              onClick={() => onStartPomodoro('short-break')}
            >
              <Coffee size={20} className="icon-coffee" />
              <div className="pomo-name">Short Break</div>
              <div className="pomo-desc">5 mins</div>
            </button>
            <button
              className={`pomo-phase-card ${
                timer.pomodoroPhase === 'long-break' ? 'active' : ''
              }`}
              onClick={() => onStartPomodoro('long-break')}
            >
              <Moon size={20} className="icon-moon" />
              <div className="pomo-name">Long Rest</div>
              <div className="pomo-desc">15 mins</div>
            </button>
          </div>

          <div className="pomo-stats-card">
            <span>Completed Focus Sessions:</span>
            <span className="stats-badge">{pomodoroSessions} 🔥</span>
          </div>
        </div>
      )}
    </div>
  );
};
