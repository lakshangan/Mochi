import React, { useEffect, useState } from 'react';
import { PetAnimationState } from '../../shared/types';

interface IslandFluidOrbProps {
  state: PetAnimationState;
  isSpeaking?: boolean;
  size?: number;
}

export const IslandFluidOrb: React.FC<IslandFluidOrbProps> = ({
  state,
  isSpeaking = false,
  size = 28,
}) => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const interval = setInterval(() => {
      setBlink(true);
      blinkTimeout = setTimeout(() => setBlink(false), 170);
    }, 3500 + Math.random() * 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(blinkTimeout);
    };
  }, []);

  // Expressive high-DPI vector eyes (no pixelated LED matrix)
  const renderEyes = () => {
    if (state === 'sleeping') {
      return (
        <svg viewBox="0 0 28 28" className="island-vector-face" aria-hidden="true">
          <line x1="8.5" y1="14.5" x2="12.5" y2="14.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="15.5" y1="14.5" x2="19.5" y2="14.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    }

    if (state === 'happy' || state === 'celebrating') {
      return (
        <svg viewBox="0 0 28 28" className="island-vector-face" aria-hidden="true">
          <path d="M 8 15 Q 10.5 12 13 15" stroke="#ffffff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M 15 15 Q 17.5 12 20 15" stroke="#ffffff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </svg>
      );
    }

    // Default eyes with natural vector blink
    return (
      <svg viewBox="0 0 28 28" className="island-vector-face" aria-hidden="true">
        <rect
          x="9"
          y={blink ? 13.5 : 10}
          width="3.5"
          height={blink ? 1.5 : 8}
          rx={blink ? 0.75 : 1.75}
          fill="#ffffff"
          className="island-eye-pill"
        />
        <rect
          x="15.5"
          y={blink ? 13.5 : 10}
          width="3.5"
          height={blink ? 1.5 : 8}
          rx={blink ? 0.75 : 1.75}
          fill="#ffffff"
          className="island-eye-pill"
        />
      </svg>
    );
  };

  return (
    <div
      className={`island-fluid-orb ${isSpeaking ? 'speaking' : ''}`}
      data-state={state}
      style={{
        width: size,
        height: size,
      }}
    >
      <div className="island-fluid-core" />
      <div className="island-specular-glass" />
      <div className="island-face-layer">{renderEyes()}</div>
      {isSpeaking && <div className="island-speaking-halo" />}
    </div>
  );
};
