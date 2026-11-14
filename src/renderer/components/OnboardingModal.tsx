import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import mochiLogo from '../assets/mochi-logo.png';
import { AppSettings } from '../../shared/types';
import { SoundEffects } from '../../shared/sound-effects';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Droplet,
  Clock,
  Volume2,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  Compass,
  Laptop,
  BookOpen,
  Palette,
  Flame,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  platform: 'darwin' | 'win32' | 'linux';
  currentSettings: AppSettings;
  onSaveSettings: (settings: Partial<AppSettings>) => void;
  onClose: () => void;
  onRewardXp?: (xp: number) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  platform,
  currentSettings,
  onSaveSettings,
  onClose,
  onRewardXp,
}) => {
  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState(currentSettings.userName || '');
  const [selectedPersona, setSelectedPersona] = useState<string>(
    (currentSettings as any).focusPersona || 'developer'
  );
  const [selectedTheme, setSelectedTheme] = useState(currentSettings.theme || 'neon-dark');
  const [waterInterval, setWaterInterval] = useState(
    currentSettings.waterReminders.intervalMinutes || 45
  );
  const [fullScreenAlert, setFullScreenAlert] = useState(
    Boolean(currentSettings.waterReminders.fullScreenAlert)
  );
  const [soundEnabled, setSoundEnabled] = useState(currentSettings.soundEnabled);

  if (!isOpen) return null;

  const isMac = platform === 'darwin';
  const isWindows = platform === 'win32';

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f7ff', '#ff3b88', '#10b981', '#a855f7', '#fbbf24'],
      });
    } catch {
      // ignore
    }
  };

  const handleNext = () => {
    SoundEffects.chirp(0.2);
    if (step === 3) {
      fireConfetti();
      SoundEffects.celebrate(0.3);
      if (onRewardXp) {
        onRewardXp(50);
      }
    }
    setStep((prev) => Math.min(4, prev + 1));
  };

  const handlePrev = () => {
    SoundEffects.chirp(0.15);
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleFinish = () => {
    SoundEffects.appleChime(0.3);
    onSaveSettings({
      userName: userName.trim() || 'Friend',
      hasSeenWelcome: true,
      theme: selectedTheme,
      soundEnabled,
      waterReminders: {
        ...currentSettings.waterReminders,
        intervalMinutes: waterInterval,
        fullScreenAlert,
      },
    });
    onClose();
  };

  const personas = [
    {
      id: 'developer',
      name: 'Software Engineer',
      desc: 'Git companion, commit celebrate & 90-min coding streak guard',
      icon: <Laptop size={18} className="text-cyan" />,
      theme: 'neon-dark',
    },
    {
      id: 'student',
      name: 'Student / Scholar',
      desc: 'Pomodoro focus intervals, quick notes & hydration health',
      icon: <BookOpen size={18} className="text-amber" />,
      theme: 'glass-midnight',
    },
    {
      id: 'creator',
      name: 'Designer / Creator',
      desc: 'Ambient soundscapes, Dynamic Island pill mode & flow',
      icon: <Palette size={18} className="text-violet" />,
      theme: 'sunset-glow',
    },
    {
      id: 'deepwork',
      name: 'Deep Work Master',
      desc: 'Unmissable full-screen alerts, task prioritization & zero distraction',
      icon: <Flame size={18} className="text-emerald" />,
      theme: 'matcha-zen',
    },
  ];

  return (
    <div className="onboarding-overlay" onClick={onClose}>
      <div className="onboarding-card" onClick={(e) => e.stopPropagation()}>
        {/* Top Progress & Close Bar */}
        <div className="onboarding-top-bar">
          <div className="onboarding-step-indicator">
            <span className="step-badge">Step {step + 1} of 5</span>
            <div className="step-dots">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`step-dot ${i === step ? 'active' : i < step ? 'completed' : ''}`}
                />
              ))}
            </div>
          </div>
          <button className="onboarding-close-btn" onClick={onClose} title="Skip tour">
            <X size={15} />
          </button>
        </div>

        {/* Slide 0: Meet Mochi */}
        {step === 0 && (
          <div className="onboarding-slide">
            <div className="mascot-preview-ring">
              <img src={mochiLogo} alt="Mochi Mascot" className="onboarding-mascot-img" />
              <div className="glow-ping" />
            </div>
            <h2 className="slide-title">Meet Mochi! ✨</h2>
            <p className="slide-lead">
              Your living desktop companion, wellness guard, and deep work assistant that floats unobtrusively right on your screen.
            </p>

            <div className="onboarding-feature-pills">
              <div className="feature-pill">
                <Sparkles size={14} className="text-cyan" />
                <span>Ambient Desktop Pet</span>
              </div>
              <div className="feature-pill">
                <Clock size={14} className="text-amber" />
                <span>Pomodoro & Focus</span>
              </div>
              <div className="feature-pill">
                <Droplet size={14} className="text-emerald" />
                <span>Smart Hydration</span>
              </div>
              <div className="feature-pill">
                <GitBranch size={14} className="text-violet" />
                <span>Git Flow Companion</span>
              </div>
              <div className="feature-pill">
                <ShieldCheck size={14} className="text-pink" />
                <span>100% Offline & Private</span>
              </div>
            </div>
          </div>
        )}

        {/* Slide 1: Personalize Name & Persona */}
        {step === 1 && (
          <div className="onboarding-slide">
            <h2 className="slide-title">Personalize Your Flow 🎨</h2>
            <p className="slide-lead">
              Tell Mochi who you are so greetings and encouragement feel natural and warm.
            </p>

            <div className="form-group-center">
              <label className="input-field-label">What should Mochi call you?</label>
              <input
                type="text"
                placeholder="e.g. Alex, Maya, Jordan..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="onboarding-text-input"
                autoFocus
                maxLength={25}
              />
            </div>

            <label className="input-field-label" style={{ marginTop: '16px' }}>
              Choose your primary focus vibe:
            </label>
            <div className="persona-grid">
              {personas.map((p) => (
                <div
                  key={p.id}
                  className={`persona-card ${selectedPersona === p.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedPersona(p.id);
                    setSelectedTheme(p.theme as any);
                  }}
                >
                  <div className="persona-icon-row">
                    {p.icon}
                    {selectedPersona === p.id && (
                      <CheckCircle2 size={14} className="text-cyan" />
                    )}
                  </div>
                  <div className="persona-title">{p.name}</div>
                  <div className="persona-desc">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slide 2: Wellness & Habit Guard */}
        {step === 2 && (
          <div className="onboarding-slide">
            <h2 className="slide-title">Wellness & Focus Habits 💧🧘</h2>
            <p className="slide-lead">
              High productivity is built on smart pacing. Mochi keeps your eyes, body, and energy refreshed.
            </p>

            <div className="settings-preview-card">
              <div className="preview-row">
                <div>
                  <div className="preview-title">Hydration Reminder Interval</div>
                  <div className="preview-sub">Mochi nudges you to grab fresh water</div>
                </div>
                <div className="interval-selector">
                  {[20, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      className={`pill-btn ${waterInterval === mins ? 'active' : ''}`}
                      onClick={() => setWaterInterval(mins)}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="preview-row">
                <div>
                  <div className="preview-title">Full-Screen Mindful Alert</div>
                  <div className="preview-sub">Prominent unmissable alert for water & care breaks</div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={fullScreenAlert}
                    onChange={(e) => setFullScreenAlert(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>

              <div className="preview-row">
                <div>
                  <div className="preview-title">Procedural Sound Chimes</div>
                  <div className="preview-sub">Gentle offline audio feedback for completed timers</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => SoundEffects.waterDrop(0.5)}
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                  >
                    <Volume2 size={12} /> Test Chime
                  </button>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide 3: Cross-Platform Shortcuts & Gestures */}
        {step === 3 && (
          <div className="onboarding-slide">
            <h2 className="slide-title">
              {isMac ? ' macOS Gestures & Shortcuts' : isWindows ? '⊞ Windows Controls & Tips' : '🐧 Linux Controls & Tips'}
            </h2>
            <p className="slide-lead">
              Mochi integrates seamlessly into your operating system environment with native ergonomics.
            </p>

            <div className="os-tips-grid">
              <div className="os-tip-card">
                <div className="tip-badge">{isMac ? 'Top Menu Bar' : 'Taskbar Tray'}</div>
                <div className="tip-title">System Status Bar</div>
                <div className="tip-desc">
                  {isMac
                    ? 'Look near your Wi-Fi & Battery clock icons for the Mochi icon anytime you hide the pet.'
                    : 'Look in your bottom-right system notification tray to wake Mochi anytime.'}
                </div>
              </div>

              <div className="os-tip-card">
                <div className="tip-badge">Mouse Interaction</div>
                <div className="tip-title">Double-Click Pill Mode</div>
                <div className="tip-desc">
                  Double-click Mochi to collapse into a sleek, minimal Dynamic Island capsule.
                </div>
              </div>

              <div className="os-tip-card">
                <div className="tip-badge">Free Movement</div>
                <div className="tip-title">Drag Anywhere</div>
                <div className="tip-desc">
                  Click and hold Mochi to slide it across any corner of your multiple monitors.
                </div>
              </div>

              <div className="os-tip-card">
                <div className="tip-badge">Right-Click</div>
                <div className="tip-title">Quick Action Menu</div>
                <div className="tip-desc">
                  Right-click Mochi anywhere to instantly trigger stretches, rest the pet, or exit.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide 4: Celebration & Launch */}
        {step === 4 && (
          <div className="onboarding-slide celebration-slide">
            <div className="celebration-badge-box">
              <span className="badge-sparkles">🎉</span>
              <div className="badge-name">Welcome Pioneer</div>
              <div className="badge-reward">+50 Flow XP Unlocked</div>
            </div>

            <h2 className="slide-title">You&apos;re All Set, {userName.trim() || 'Friend'}! 🚀</h2>
            <p className="slide-lead">
              Mochi is now floating on your desktop ready to accompany you into deep flow state.
            </p>

            <div className="revisit-hint">
              💡 <em>Pro-tip:</em> You can reopen this Tour guide or adjust preferences anytime by clicking the <strong>Tour</strong> button in the top titlebar!
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="onboarding-footer">
          {step > 0 ? (
            <button className="btn btn-outline" onClick={handlePrev}>
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button className="btn btn-primary" onClick={handleNext}>
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary btn-launch" onClick={handleFinish}>
              <Sparkles size={16} /> Launch Mochi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

