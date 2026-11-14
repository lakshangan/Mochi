import React from 'react';
import mochiLogo from '../assets/mochi-logo.png';
import { Sparkles, EyeOff, Power, Wind, Compass } from 'lucide-react';

interface AssistantTitlebarProps {
  platform: 'darwin' | 'win32' | 'linux';
  petState: string;
  levelInfo: {
    level: number;
    title: string;
    progressPercent: number;
  };
  totalXp: number;
  onClose: () => void;
  onMinimize: () => void;
  onQuit: () => void;
  onOpenStretches: () => void;
  onOpenBreathing: () => void;
  onOpenOnboarding: () => void;
  onToggleDeepWork: () => void;
}

export const AssistantTitlebar: React.FC<AssistantTitlebarProps> = ({
  platform,
  petState,
  levelInfo,
  totalXp,
  onClose,
  onMinimize,
  onQuit,
  onOpenStretches,
  onOpenBreathing,
  onOpenOnboarding,
  onToggleDeepWork,
}) => {
  const isMac = platform === 'darwin';
  const isWindows = platform === 'win32';
  const isLinux = platform === 'linux';

  return (
    <div className={`assistant-header-bar platform-${platform}`}>
      {/* Left Section */}
      {isMac ? (
        // macOS Traffic Lights on the Left
        <div className="mac-traffic-lights">
          <button
            className="traffic-dot close"
            onClick={onClose}
            title="Hide Assistant (Quit from Turn Off button)"
          >
            <span className="traffic-icon">×</span>
          </button>
          <button
            className="traffic-dot minimize"
            onClick={onMinimize}
            title="Minimize Assistant Panel"
          >
            <span className="traffic-icon">−</span>
          </button>
          <button
            className="traffic-dot zoom"
            onClick={onOpenOnboarding}
            title="Feature Tour & Guide"
          >
            <span className="traffic-icon">+</span>
          </button>
        </div>
      ) : (
        // Windows & Linux: Brand Logo & Title on the Left
        <div className="non-mac-brand-col">
          <img src={mochiLogo} alt="Mochi" className="brand-logo-img" />
          <span className="brand-title">Mochi Companion</span>
          <span className="os-badge-pill" title={`Running native on ${isWindows ? 'Windows' : 'Linux'}`}>
            {isWindows ? '⊞ Win' : '🐧 Linux'}
          </span>
          <div
            className="mac-level-pill"
            title={`${totalXp} Total XP (${levelInfo.progressPercent}% to next level)`}
          >
            <Sparkles size={11} className="level-sparkle" />
            <span>Lv.{levelInfo.level}</span>
          </div>
        </div>
      )}

      {/* Center Section */}
      {isMac ? (
        <div className="mac-title-center">
          <img src={mochiLogo} alt="Mochi" className="brand-logo-img" />
          <span className="brand-title">Mochi</span>
          <span className="mac-status-pill" data-state={petState}>
            <span className="status-dot-mini" />
            <span>{petState}</span>
          </span>
          <div
            className="mac-level-pill"
            title={`${totalXp} Total XP (${levelInfo.progressPercent}% to next level)`}
          >
            <Sparkles size={10} className="level-sparkle" />
            <span>Lv.{levelInfo.level}</span>
          </div>
        </div>
      ) : (
        <div className="center-actions-cluster">
          <button
            className="hdr-btn tour"
            onClick={onOpenOnboarding}
            title="Interactive Feature Tour & Setup Guide"
          >
            <Compass size={12} />
            <span>Tour</span>
          </button>
          <button
            className="hdr-btn breathe"
            onClick={onOpenBreathing}
            title="Guided Box Breathing & Calm Reset"
          >
            <Wind size={12} />
            <span>Breathe</span>
          </button>
          <button
            className="hdr-btn stretch"
            onClick={onOpenStretches}
            title="30s Guided Ergonomic Stretches"
          >
            <span>🧘</span>
            <span>Stretch</span>
          </button>
        </div>
      )}

      {/* Right Section */}
      {isMac ? (
        // macOS Quick Actions on Right
        <div className="mac-title-actions">
          <button
            className="mac-action-pill-btn tour"
            onClick={onOpenOnboarding}
            title="Interactive Feature Tour & Setup Guide"
          >
            <Compass size={12} />
            <span>Tour</span>
          </button>
          <button
            className="mac-action-pill-btn breathe"
            onClick={onOpenBreathing}
            title="Guided Mindful Box Breathing"
          >
            <Wind size={12} />
            <span>Breathe</span>
          </button>
          <button
            className="mac-action-icon-btn stretch"
            onClick={onOpenStretches}
            title="30s Quick Guided Stretches for Posture & Wrists"
          >
            <span>🧘</span>
          </button>
          <button
            className="mac-action-icon-btn deepwork"
            onClick={onToggleDeepWork}
            title="Hide Mochi for full-screen Deep Work"
          >
            <EyeOff size={12} />
          </button>
          <button
            className="mac-action-icon-btn danger"
            onClick={onQuit}
            title="Turn Off Mochi (Quit App)"
          >
            <Power size={12} />
          </button>
        </div>
      ) : (
        // Windows & Linux Caption Controls on Right
        <div className="win-caption-controls">
          <button
            className="win-caption-btn win-minimize"
            onClick={onMinimize}
            title="Minimize"
          >
            <span>&#x2212;</span>
          </button>
          <button
            className="win-caption-btn win-maximize"
            onClick={onOpenOnboarding}
            title="Tour & Fullscreen Tips"
          >
            <span>&#x25A2;</span>
          </button>
          <button
            className="win-caption-btn win-close"
            onClick={onClose}
            title="Close Assistant"
          >
            <span>&#x2715;</span>
          </button>
        </div>
      )}
    </div>
  );
};

