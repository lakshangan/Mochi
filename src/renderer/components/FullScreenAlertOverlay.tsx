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
  const isWater = event.type === 'water';

  return (
    <div className="fullscreen-alert-root">
      {/* Background Ripple Waves */}
      <div className="water-ripple-container">
        <div className="ripple-wave wave-1" />
        <div className="ripple-wave wave-2" />
        <div className="ripple-wave wave-3" />
      </div>

      <div className="alert-content-card">
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
        <h1 className="alert-hero-title">{event.title}</h1>
        <p className="alert-hero-subtitle">
          {settings?.userName
            ? `Hey ${settings.userName}! ${event.message}`
            : event.message}
        </p>

        {/* Water Intake Tracker Row */}
        {isWater && (
          <div className="water-intake-badge">
            <div className="intake-glasses-row">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <div
                  key={num}
                  className={`glass-dot ${num <= todayCount ? 'filled' : 'empty'}`}
                  title={`Glass ${num}`}
                >
                  <Droplet size={13} />
                </div>
              ))}
            </div>
            <div className="intake-text">
              Today&apos;s Intake: <strong>{todayCount} / 8 glasses</strong> logged
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
            <Check size={20} />
            <span>{isWater ? 'I Drank Water! 🥤' : 'Take Break Now 🌿'}</span>
            <span className="btn-key-hint">↵ Enter</span>
          </button>

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

        {isWater && (
          <div className="accountability-hint">
            💡 <em>Mochi Notice:</em> If you snooze or dismiss without logging, Mochi will make an angry face 😠 for a few seconds!
          </div>
        )}
      </div>
    </div>
  );
};
