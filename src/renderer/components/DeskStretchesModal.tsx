import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Check, Heart, Sparkles } from 'lucide-react';
import { SoundEffects } from '../../shared/sound-effects';

interface DeskStretchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardXp?: (xp: number) => void;
}

interface StretchItem {
  id: string;
  title: string;
  subtitle: string;
  durationSeconds: number;
  instructions: string[];
  icon: string;
}

const STRETCHES: StretchItem[] = [
  {
    id: 'wrist',
    title: 'Wrist & Forearm Flexor Release',
    subtitle: 'Relieves keyboard and mouse tension',
    durationSeconds: 30,
    instructions: [
      'Extend your right arm forward with palm facing out.',
      'Gently pull your fingers back toward your body with your left hand.',
      'Hold for 15 seconds, then switch to the left arm.',
      'Breathe deeply and relax your shoulders.',
    ],
    icon: '🤲',
  },
  {
    id: 'shoulder',
    title: 'Shoulder Rolls & Scapular Squeeze',
    subtitle: 'Reverses desk hunching and opens chest',
    durationSeconds: 30,
    instructions: [
      'Sit tall with your feet flat on the floor.',
      'Roll your shoulders up toward your ears, then roll them back and down.',
      'Squeeze your shoulder blades together gently for 3 seconds.',
      'Repeat in smooth, slow circles 8-10 times.',
    ],
    icon: '✨',
  },
  {
    id: 'neck',
    title: 'Cervical Neck Gentle Side-Tilt',
    subtitle: 'Eliminates screen fatigue and neck stiffness',
    durationSeconds: 30,
    instructions: [
      'Lower your right ear toward your right shoulder without lifting the shoulder.',
      'Optionally rest your right hand lightly on your head for gentle weight.',
      'Hold for 15 seconds, enjoying the lateral stretch.',
      'Slowly return to center and repeat on the left side.',
    ],
    icon: '🧘',
  },
];

export const DeskStretchesModal: React.FC<DeskStretchesModalProps> = ({
  isOpen,
  onClose,
  onRewardXp,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);

  const currentStretch = STRETCHES[currentIdx];

  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false);
      setSecondsLeft(30);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      SoundEffects.celebrate(0.35);
      if (!completed.includes(currentStretch.id)) {
        setCompleted((prev) => [...prev, currentStretch.id]);
        if (onRewardXp) onRewardXp(40);
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, secondsLeft, currentStretch.id, completed, onRewardXp]);

  if (!isOpen) return null;

  const handleSelectStretch = (idx: number) => {
    setCurrentIdx(idx);
    setSecondsLeft(STRETCHES[idx].durationSeconds);
    setIsRunning(false);
  };

  const handleToggleTimer = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(currentStretch.durationSeconds);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(currentStretch.durationSeconds);
  };

  const progress = ((currentStretch.durationSeconds - secondsLeft) / currentStretch.durationSeconds) * 100;

  return (
    <div className="stretch-modal-overlay">
      <div className="stretch-modal-content">
        <div className="stretch-modal-header">
          <div className="flex items-center gap-2">
            <span className="stretch-header-badge">HEALTH & ERGONOMICS</span>
            <h3>Quick 30s Desk Stretches</h3>
          </div>
          <button onClick={onClose} className="icon-btn">
            <X size={18} />
          </button>
        </div>

        {/* Stretch Tabs */}
        <div className="stretch-tabs-row">
          {STRETCHES.map((s, idx) => {
            const isDone = completed.includes(s.id);
            const isSelected = idx === currentIdx;
            return (
              <button
                key={s.id}
                onClick={() => handleSelectStretch(idx)}
                className={`stretch-tab-pill ${isSelected ? 'active' : ''} ${isDone ? 'done' : ''}`}
              >
                <span>{s.icon}</span>
                <span>{s.title.split(' ')[0]}</span>
                {isDone && <Check size={12} className="check-done" />}
              </button>
            );
          })}
        </div>

        {/* Active Stretch Display */}
        <div className="stretch-active-card">
          <div className="stretch-meta">
            <h4>{currentStretch.title}</h4>
            <p className="stretch-subtitle">{currentStretch.subtitle}</p>
          </div>

          {/* Progress Ring / Timer */}
          <div className="stretch-timer-ring-box">
            <div className="stretch-circle-wrap">
              <svg className="stretch-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" className="ring-bg" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="ring-progress"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * progress) / 100}
                />
              </svg>
              <div className="stretch-time-display">
                <span className="time-number">{secondsLeft}</span>
                <span className="time-unit">sec</span>
              </div>
            </div>

            <div className="stretch-controls">
              <button onClick={handleToggleTimer} className="btn btn-primary btn-md">
                {isRunning ? <Pause size={16} /> : <Play size={16} />}
                <span>{isRunning ? 'Pause' : secondsLeft === 0 ? 'Repeat' : 'Start Stretch'}</span>
              </button>
              <button onClick={handleReset} className="btn btn-outline btn-md" title="Reset">
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Instructions List */}
          <div className="stretch-instructions-box">
            <h5>How to perform:</h5>
            <ol>
              {currentStretch.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>

        <div className="stretch-footer-bar">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Sparkles size={14} className="accent-icon" />
            <span>Completing a stretch earns +40 XP for Mochi!</span>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-outline">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
