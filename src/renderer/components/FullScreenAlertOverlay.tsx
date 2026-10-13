import React, { useEffect, useState } from 'react';
import { ReminderNotificationEvent, AppSettings } from '../../shared/types';
import { SoundEffects } from '../../shared/sound-effects';
import { Droplet, Check, Clock, X, Sparkles } from 'lucide-react';
import '../styles/fullscreen-alert.css';

export const FullScreenAlertOverlay: React.FC = () => {
  const [event, setEvent] = useState<ReminderNotificationEvent>({
    type: 'water',
    title: 'Time to Hydrate! 💧',
    message: 'Mochi reminds you: Grab a fresh glass of water to keep your body & mind energized.',
    timestamp: Date.now(),
    dueAt: Date.now(),
    fullScreenAlert: true,
  });

  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    // Play attention chime on mount
    SoundEffects.chime(0.45);

    // Fetch initial settings to display today's drink count and user name
    if (window.mochiApi) {
      window.mochiApi.getInitialState().then((state) => {
        if (state?.settings) {
          setSettings(state.settings);
        }
      }).catch(console.error);

      // Listen for incoming reminder event
      const unsub = window.mochiApi.onAlertEvent?.((ev: ReminderNotificationEvent) => {
        setEvent(ev);
        SoundEffects.chime(0.45);
      });

      return () => {
        unsub?.();
      };
    }
  }, []);

  const handleComplete = async () => {
    SoundEffects.celebrate(0.4);
    if (window.mochiApi) {
      if (event.type === 'water') {
        await window.mochiApi.completeWater();
      } else {
        await window.mochiApi.startBreakTimer();
      }
      await window.mochiApi.closeAlertWindow?.();
    }
  };

  const handleSnooze = async () => {
    if (window.mochiApi) {
      if (event.type === 'water') {
        await window.mochiApi.snoozeWater(5);
      } else {
        await window.mochiApi.snoozeBreak(5);
      }
      await window.mochiApi.closeAlertWindow?.();
    }
  };

  const handleDismiss = async () => {
    if (window.mochiApi) {
      if (event.type === 'water') {
        await window.mochiApi.dismissWater();
      } else {
        await window.mochiApi.dismissBreak();
      }
      await window.mochiApi.closeAlertWindow?.();
    }
  };

  // Keyboard shortcut listener: Enter = Complete, S = Snooze, Esc = Dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleComplete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleDismiss();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSnooze();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [event]);

  const todayCount = settings?.waterReminders?.todayCount ?? 0;
  const targetGlasses = 8;
  const progressPercent = Math.min(100, Math.round((todayCount / targetGlasses) * 100));
  const isWater = event.type === 'water';

  return (
    <div
      className="fullscreen-alert-root"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
    >
      {/* Background Ripple Waves */}
      <div className="water-ripple-container">
        <div className="ripple-wave wave-1" />
        <div className="ripple-wave wave-2" />
        <div className="ripple-wave wave-3" />
        <div className="ripple-wave wave-4" />
      </div>

      {/* Floating Ambient Aqua Bubbles */}
      <div className="ambient-bubbles-layer">
        <div className="ambient-bubble b1" />
        <div className="ambient-bubble b2" />
        <div className="ambient-bubble b3" />
        <div className="ambient-bubble b4" />
        <div className="ambient-bubble b5" />
        <div className="ambient-bubble b6" />
        <div className="ambient-bubble b7" />
        <div className="ambient-bubble b8" />
      </div>

      <div className="alert-content-card" onClick={(e) => e.stopPropagation()}>
        {/* Glow halo & hero icon */}
        <div className="hero-icon-wrapper">
          <div className="hero-halo" />
          <div className="hero-icon-bubble">
            {isWater ? (
              <span className="hero-emoji" role="img" aria-label="water">
                💧
              </span>
            ) : (
              <span className="hero-emoji" role="img" aria-label="break">
                🌿
              </span>
            )}
          </div>
        </div>

        {/* Big attention-grabbing typography */}
        <div className="alert-badge-pill">
          <Sparkles size={13} className="sparkle-icon" />
          <span>{isWater ? 'HYDRATION CHECK-IN' : 'MINDFUL MOMENT'}</span>
        </div>

        <h1 className="alert-hero-title">{event.title}</h1>
        <p className="alert-hero-subtitle">
          {settings?.userName
            ? `Hey ${settings.userName}! ${event.message}`
            : event.message}
        </p>

        {/* Water Intake Tracker Row & Progress Bar */}
        {isWater && (
          <div className="water-intake-badge">
            <div className="intake-header-row">
              <span className="intake-label">Daily Goal (8 Glasses)</span>
              <span className="intake-percent">{todayCount} / {targetGlasses} ({progressPercent}%)</span>
            </div>

            {/* Glowing progress bar */}
            <div className="intake-progress-bar-track">
              <div
                className="intake-progress-bar-fill"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>

            {/* Glass dots with numbers */}
            <div className="intake-glasses-row">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <div
                  key={num}
                  className={`glass-dot ${num <= todayCount ? 'filled' : 'empty'}`}
                  title={`Glass ${num} of 8`}
                >
                  <Droplet size={11} className="glass-droplet-icon" />
                  <span className="glass-number">{num}</span>
                </div>
              ))}
            </div>
            <div className="intake-text">
              {todayCount >= 8
                ? '🎉 Incredible! Daily hydration goal reached!'
                : `${8 - todayCount} more glass${8 - todayCount === 1 ? '' : 'es'} to hit today\'s goal`}
            </div>
          </div>
        )}

        {/* Prominent Action Buttons */}
        <div className="alert-actions-row">
          <button
            type="button"
            className="alert-btn btn-complete"
            onClick={handleComplete}
            autoFocus
          >
            <Check size={22} className="btn-icon" />
            <span className="btn-main-label">
              {isWater ? 'I Drank Water! 🥤' : 'Take Break Now 🌿'}
            </span>
            <span className="btn-key-hint">↵ Enter</span>
          </button>

          <div className="alert-secondary-actions-row">
            <button
              type="button"
              className="alert-btn btn-snooze"
              onClick={handleSnooze}
            >
              <Clock size={16} />
              <span>Snooze 5m</span>
              <span className="btn-key-hint">S</span>
            </button>

            <button
              type="button"
              className="alert-btn btn-dismiss"
              onClick={handleDismiss}
            >
              <X size={16} />
              <span>Dismiss</span>
              <span className="btn-key-hint">Esc</span>
            </button>
          </div>
        </div>

        {isWater && (
          <div className="accountability-hint">
            💡 <em>Mochi Notice:</em> Snoozing or skipping makes Mochi show an angry face 😠 for a few moments!
          </div>
        )}
      </div>
    </div>
  );
};
