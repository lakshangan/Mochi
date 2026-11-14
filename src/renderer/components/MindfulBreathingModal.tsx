import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Sparkles, Wind, Heart } from 'lucide-react';
import { SoundEffects } from '../../shared/sound-effects';

interface MindfulBreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardXp?: (xp: number) => void;
  onSetPetState?: (state: any) => void;
}

type BreathingPhase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out';

const PHASE_CONFIG: Record<
  BreathingPhase,
  { label: string; sub: string; duration: number; next: BreathingPhase; scale: number; color: string }
> = {
  inhale: {
    label: 'Inhale Deeply',
    sub: 'Fill your chest and belly with clean, fresh oxygen',
    duration: 4,
    next: 'hold-in',
    scale: 1.45,
    color: '#00f7ff',
  },
  'hold-in': {
    label: 'Hold Breath',
    sub: 'Keep your shoulders relaxed and mind still',
    duration: 4,
    next: 'exhale',
    scale: 1.45,
    color: '#a855f7',
  },
  exhale: {
    label: 'Exhale Slowly',
    sub: 'Release all tension, stress, and fatigue through your mouth',
    duration: 4,
    next: 'hold-out',
    scale: 0.85,
    color: '#10b981',
  },
  'hold-out': {
    label: 'Rest & Pause',
    sub: 'Enjoy the empty space and mental quiet',
    duration: 4,
    next: 'inhale',
    scale: 0.85,
    color: '#38bdf8',
  },
};

export const MindfulBreathingModal: React.FC<MindfulBreathingModalProps> = ({
  isOpen,
  onClose,
  onRewardXp,
  onSetPetState,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [hasFinished, setHasFinished] = useState(false);

  const TARGET_CYCLES = 4;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsActive(false);
      setPhase('inhale');
      setPhaseSecondsLeft(4);
      setCompletedCycles(0);
      setHasFinished(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setPhaseSecondsLeft((prev) => {
        if (prev <= 1) {
          // Transition phase
          setPhase((currentPhase) => {
            const nextPhase = PHASE_CONFIG[currentPhase].next;
            if (currentPhase === 'hold-out') {
              setCompletedCycles((c) => {
                const updated = c + 1;
                if (updated >= TARGET_CYCLES) {
                  setIsActive(false);
                  setHasFinished(true);
                  SoundEffects.celebrate(0.35);
                  if (onRewardXp) onRewardXp(25);
                  if (onSetPetState) onSetPetState('smile');
                }
                return updated;
              });
            }

            if (nextPhase === 'inhale') {
              SoundEffects.chirp(0.18);
            } else if (nextPhase === 'exhale') {
              SoundEffects.waterDrop(0.25);
            }

            return nextPhase;
          });
          return PHASE_CONFIG[PHASE_CONFIG[phase].next].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phase, onRewardXp, onSetPetState]);

  if (!isOpen) return null;

  const currentCfg = PHASE_CONFIG[phase];

  return (
    <div className="onboarding-overlay" onClick={onClose}>
      <div className="breathing-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-title-with-icon">
            <Wind size={18} className="text-cyan" />
            <span>Mindful Box Breathing (4-4-4-4)</span>
          </div>
          <button className="onboarding-close-btn" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        {!hasFinished ? (
          <div className="breathing-stage">
            <div className="breathing-cycle-indicator">
              Cycle {Math.min(TARGET_CYCLES, completedCycles + 1)} of {TARGET_CYCLES}
            </div>

            {/* Pulsing Breathing Orb */}
            <div className="breathing-orb-container">
              <div
                className="breathing-pulse-orb"
                style={{
                  transform: `scale(${isActive ? currentCfg.scale : 1})`,
                  borderColor: currentCfg.color,
                  boxShadow: `0 0 45px ${currentCfg.color}44, inset 0 0 35px ${currentCfg.color}33`,
                  transition: `transform ${currentCfg.duration}s cubic-bezier(0.4, 0, 0.2, 1)`,
                }}
              >
                <div className="breathing-inner-counter">{phaseSecondsLeft}s</div>
              </div>
            </div>

            {/* Phase Instructions */}
            <div className="breathing-text-col">
              <h3 className="breathing-phase-title" style={{ color: currentCfg.color }}>
                {isActive ? currentCfg.label : 'Ready to Center Yourself?'}
              </h3>
              <p className="breathing-phase-sub">
                {isActive
                  ? currentCfg.sub
                  : '4-second Box Breathing regulates your nervous system, drops cortisol, and restores sharp focus.'}
              </p>
            </div>

            {/* Controls */}
            <div className="breathing-controls-row">
              {!isActive ? (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => {
                    setIsActive(true);
                    SoundEffects.chirp(0.2);
                  }}
                >
                  <Play size={16} /> Begin Breathing Exercise
                </button>
              ) : (
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setIsActive(false);
                  }}
                >
                  <Pause size={16} /> Pause
                </button>
              )}
              <button
                className="btn btn-outline btn-icon"
                onClick={() => {
                  setIsActive(false);
                  setPhase('inhale');
                  setPhaseSecondsLeft(4);
                  setCompletedCycles(0);
                }}
                title="Reset"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="breathing-stage celebration-stage">
            <div className="reward-glow-badge">
              <Heart size={28} className="text-pink" />
              <span>Calm Achieved</span>
            </div>
            <h3 className="celebration-title">Mind & Body Restored ✨</h3>
            <p className="celebration-sub">
              Fantastic job completing 4 cycles of mindful breathing. Your focus is sharp and your nervous system is reset.
            </p>
            <div className="xp-chip">
              <Sparkles size={13} className="text-amber" />
              <span>+25 Calm XP Awarded</span>
            </div>

            <button
              className="btn btn-primary"
              style={{ marginTop: '20px' }}
              onClick={onClose}
            >
              Back to Deep Work
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

