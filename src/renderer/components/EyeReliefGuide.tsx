import React, { useState, useEffect } from 'react';
import { Eye, X, Check } from 'lucide-react';
import { SoundEffects } from '../../shared/sound-effects';

interface EyeReliefGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardXp?: (xp: number) => void;
}

export const EyeReliefGuide: React.FC<EyeReliefGuideProps> = ({
  isOpen,
  onClose,
  onRewardXp,
}) => {
  const [seconds, setSeconds] = useState(20);
  const [pointPos, setPointPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (!isOpen) {
      setSeconds(20);
      return;
    }

    // Move focal point gently across screen
    const interval = setInterval(() => {
      setPointPos({
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 60,
      });
    }, 3000);

    const countdown = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(countdown);
          SoundEffects.celebrate(0.35);
          if (onRewardXp) onRewardXp(30);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdown);
    };
  }, [isOpen, onRewardXp]);

  if (!isOpen) return null;

  return (
    <div className="eye-relief-overlay">
      <button onClick={onClose} className="eye-relief-close-btn">
        <X size={20} />
      </button>

      {/* Floating guided focal orb */}
      <div
        className="eye-focal-point"
        style={{
          left: `${pointPos.x}%`,
          top: `${pointPos.y}%`,
        }}
      >
        <div className="focal-glow-ring" />
      </div>

      <div className="eye-relief-center-card">
        <div className="eye-icon-box">
          <Eye size={28} className="eye-icon" />
        </div>
        <h3>20-20-20 Eye Relaxation</h3>
        <p>Look away from your screen or follow the glowing beacon for 20 seconds.</p>
        <div className="eye-timer-badge">
          {seconds > 0 ? (
            <span>{seconds}s remaining</span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Check size={16} /> Eyes Rested! +30 XP
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
