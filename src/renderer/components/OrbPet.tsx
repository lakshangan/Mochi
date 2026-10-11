import React, { useEffect, useRef, useState } from 'react';
import { MochiOrbScene } from '../graphics/orb-scene';
import { FallbackOrbRenderer } from '../graphics/fallback-renderer';
import { MovementController } from '../engine/movement-controller';
import { AnimationController } from '../engine/animation-controller';
import { BehaviorEngine } from '../engine/behavior-engine';
import { PetAnimationState, SystemActivityEvent, ActiveTimerState } from '../../shared/types';
import { SoundEffects } from '../../shared/sound-effects';
import { Power, Timer as TimerIcon, Sparkles } from 'lucide-react';
import { ParticlesOrb } from '@/registry/orbe/particles-orb/particles-orb';
import type { OrbState } from '@/registry/lib/orb-state';

const mapPetStateToOrbState = (petState: PetAnimationState): OrbState => {
  switch (petState) {
    case 'listening':
      return 'listening';
    case 'coding':
    case 'thinking':
    case 'focused':
      return 'thinking';
    case 'happy':
    case 'celebrating':
    case 'reminding':
      return 'speaking';
    case 'sleeping':
      return 'disabled';
    default:
      return 'idle';
  }
};

export const OrbPet: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MochiOrbScene | FallbackOrbRenderer | null>(null);
  const animControllerRef = useRef<AnimationController | null>(null);
  const behaviorEngineRef = useRef<BehaviorEngine | null>(null);
  const moveControllerRef = useRef<MovementController | null>(null);

  const [orbMode, setOrbMode] = useState<'particles' | '3d-face'>('particles');
  const [currentState, setCurrentState] = useState<PetAnimationState>('idle');
  const [isHovered, setIsHovered] = useState(false);
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(null);
  const [greeting, setGreeting] = useState<{ title: string; subtitle: string }>({
    title: 'Hello there.',
    subtitle: 'Click me to open your assistant.',
  });
  const [reactionMessage, setReactionMessage] = useState<{
    title: string;
    subtitle: string;
    appName?: string;
  } | null>(null);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDynamicGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good evening';
    if (hour >= 5 && hour < 12) {
      timeGreeting = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good afternoon';
    } else if (hour >= 17 && hour < 22) {
      timeGreeting = 'Good evening';
    } else {
      timeGreeting = 'Working late';
    }

    const tips = [
      { title: `${timeGreeting}.`, subtitle: 'Ready to assist your focus & productivity.' },
      { title: 'Welcome back.', subtitle: 'Let me know how I can help you today.' },
      { title: 'Stay hydrated.', subtitle: 'Take deep breaths and keep flow going.' },
      { title: 'Focus companion.', subtitle: 'Click anytime to manage timers or notes.' },
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setGreeting(getDynamicGreeting());
    animControllerRef.current?.triggerReaction('happy', 2500);
    SoundEffects.chirp(0.2);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handlePetAction = () => {
    behaviorEngineRef.current?.handlePetClick();
    SoundEffects.chirp(0.35);
    if (window.mochiApi) {
      window.mochiApi.toggleAssistant();
    }
  };

  const handleQuit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.mochiApi) {
      window.mochiApi.quitApp();
    } else {
      window.close();
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Initialize Animation Controller
    const anim = new AnimationController();
    animControllerRef.current = anim;

    // 2. Initialize Behavior Engine
    const behavior = new BehaviorEngine(anim);
    behaviorEngineRef.current = behavior;

    // 3. Initialize 3D Scene with WebGL fallback if in 3D face mode
    if (orbMode === '3d-face') {
      try {
        const scene = new MochiOrbScene(containerRef.current);
        sceneRef.current = scene;
      } catch (err) {
        console.warn('[OrbPet] WebGL init failed, falling back to 2D Canvas:', err);
        const fallback = new FallbackOrbRenderer(containerRef.current);
        sceneRef.current = fallback;
      }
    }

    // 4. Hook up Animation Controller changes to 3D Scene
    const unsubAnim = anim.onChange((state) => {
      setCurrentState(state);
      sceneRef.current?.setState(state);
    });

    // 5. Initialize Movement & Gaze Controller
    const move = new MovementController(containerRef.current, {
      onDragStart: () => {
        behavior.handleDragStart();
      },
      onDragEnd: () => {
        behavior.handleDragEnd();
      },
      onGazeMove: (nx, ny) => {
        sceneRef.current?.setGaze(nx, ny);
      },
      onClick: () => {
        handlePetAction();
      },
    });
    moveControllerRef.current = move;

    // 6. Listen to main process IPC triggers
    let unsubIpc: (() => void) | undefined;
    let unsubTimerTick: (() => void) | undefined;
    let unsubTimerComp: (() => void) | undefined;
    let unsubReminder: (() => void) | undefined;
    let unsubActivity: (() => void) | undefined;

    let reactionTimeout: NodeJS.Timeout;
    let speakingTimeout: NodeJS.Timeout;

    if (window.mochiApi) {
      unsubIpc = window.mochiApi.onPetStateChange((state) => {
        anim.setState(state);
      });

      unsubActivity = window.mochiApi.onSystemActivity((event: SystemActivityEvent) => {
        setReactionMessage({
          title: event.title,
          subtitle: event.subtitle,
          appName: event.appName,
        });

        sceneRef.current?.setSpeaking(true);
        if (speakingTimeout) clearTimeout(speakingTimeout);
        speakingTimeout = setTimeout(() => {
          sceneRef.current?.setSpeaking(false);
        }, 2500);

        if (reactionTimeout) clearTimeout(reactionTimeout);
        reactionTimeout = setTimeout(() => {
          setReactionMessage(null);
        }, 6000);
      });

      unsubTimerTick = window.mochiApi.onTimerTick((timer: ActiveTimerState) => {
        setActiveTimer(timer);
        if (timer.status === 'running' && timer.totalDurationSeconds > 0) {
          const progress = 1 - timer.remainingSeconds / timer.totalDurationSeconds;
          const formatted = formatTime(timer.remainingSeconds);
          sceneRef.current?.setTimer(true, progress, formatted);
        } else {
          sceneRef.current?.setTimer(false);
        }
      });

      unsubTimerComp = window.mochiApi.onTimerCompleted(() => {
        setActiveTimer(null);
        sceneRef.current?.setTimer(false);
        behavior.handleTimerComplete();
      });

      unsubReminder = window.mochiApi.onReminderTriggered(() => {
        behavior.handleReminderTriggered();
      });
    }

    return () => {
      unsubAnim();
      unsubIpc?.();
      unsubTimerTick?.();
      unsubTimerComp?.();
      unsubReminder?.();
      unsubActivity?.();
      if (reactionTimeout) clearTimeout(reactionTimeout);
      if (speakingTimeout) clearTimeout(speakingTimeout);
      move.destroy();
      anim.destroy();
      behavior.destroy();
      sceneRef.current?.destroy();
      sceneRef.current = null;
    };
  }, [orbMode]);

  const isTimerRunning = activeTimer && activeTimer.status === 'running';

  return (
    <div
      className="mochi-pet-window"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Siri / Gemini Style Floating Context Speech Bubble */}
      {(isHovered || reactionMessage) && (
        <div
          className="mochi-speech-bubble"
          onClick={handlePetAction}
          title="Click to open Mochi Assistant"
        >
          <div className="bubble-body">
            <div className="bubble-title">
              {reactionMessage ? reactionMessage.title : greeting.title}
            </div>
            <div className="bubble-subtitle">
              {reactionMessage ? reactionMessage.subtitle : greeting.subtitle}
            </div>
          </div>
          <div className="bubble-actions">
            <span className="bubble-badge">Open ⌘</span>
            <button
              className="bubble-power-btn"
              onClick={handleQuit}
              title="Turn Off Mochi (Quit App)"
            >
              <Power size={11} />
            </button>
          </div>
          <div className="bubble-tail" />
        </div>
      )}

      {/* Mascot Digital Timer Representation (Holographic Timer Badge) */}
      {isTimerRunning && (
        <div
          className="mochi-timer-hologram-pill"
          onClick={handlePetAction}
          title="Click to open timer controls"
        >
          <span className="timer-hologram-dot" />
          <TimerIcon size={12} className="timer-hologram-icon" />
          <span className="timer-hologram-time">{formatTime(activeTimer.remainingSeconds)}</span>
          <span className="timer-hologram-label">{activeTimer.label || 'FOCUS'}</span>
        </div>
      )}

      {/* Living Orb Canvas Container */}
      <div
        ref={containerRef}
        className={`mochi-orb-canvas-container ${isHovered || reactionMessage ? 'hovered' : ''}`}
        title="Mochi Companion (Click to open assistant, drag to move)"
      >
        {orbMode === 'particles' && (
          <ParticlesOrb
            state={mapPetStateToOrbState(currentState)}
            size={168}
            speed={1}
            colorFrom="#f0abfc"
            colorTo="#818cf8"
          />
        )}
      </div>

      {/* Sleek Minimal Status, Mode Toggle & Quick Turn Off Pill below Mochi */}
      <div className={`mochi-hover-pill ${isHovered || reactionMessage ? 'visible' : ''}`}>
        <span className="mochi-dot" />
        <span className="mochi-label">{currentState.toUpperCase()}</span>
        <button
          className="mochi-mode-toggle-btn"
          onClick={(e) => {
            e.stopPropagation();
            setOrbMode((prev) => (prev === 'particles' ? '3d-face' : 'particles'));
          }}
          title="Switch between Particles Orb and 3D Cyber Face"
        >
          <Sparkles size={10} />
          <span>{orbMode === 'particles' ? 'Particles' : '3D Face'}</span>
        </button>
        <button
          className="mochi-turn-off-btn"
          onClick={handleQuit}
          title="Turn Off Mochi (Quit App)"
        >
          <Power size={10} />
          <span>Turn Off</span>
        </button>
      </div>
    </div>
  );
};
