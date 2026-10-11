import React, { useEffect, useRef, useState } from 'react';
import { MovementController } from '../engine/movement-controller';
import { AnimationController } from '../engine/animation-controller';
import { BehaviorEngine } from '../engine/behavior-engine';
import { PetAnimationState, SystemActivityEvent, ActiveTimerState } from '../../shared/types';
import { SoundEffects } from '../../shared/sound-effects';
import { Power, Timer as TimerIcon, Sparkles } from 'lucide-react';
import { ParticlesOrb } from '@/registry/orbe/particles-orb/particles-orb';
import { GlowLavaOrb } from './GlowLavaOrb';
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
  const animControllerRef = useRef<AnimationController | null>(null);
  const behaviorEngineRef = useRef<BehaviorEngine | null>(null);
  const moveControllerRef = useRef<MovementController | null>(null);

  const [orbMode, setOrbMode] = useState<'glow-lava' | 'particles'>('glow-lava');
  const [petSize, setPetSize] = useState<number>(115);
  const [currentState, setCurrentState] = useState<PetAnimationState>('idle');
  const [isHovered, setIsHovered] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingBurst, setTypingBurst] = useState(false);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(null);
  const [greeting, setGreeting] = useState<{ title: string; subtitle: string }>({
    title: 'Ready to ship',
    subtitle: 'Click me anytime to open assistant.',
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
    let timeGreeting = 'Evening focus';
    if (hour >= 5 && hour < 12) {
      timeGreeting = 'Morning rhythm';
    } else if (hour >= 12 && hour < 17) {
      timeGreeting = 'Afternoon drive';
    } else if (hour >= 17 && hour < 22) {
      timeGreeting = 'Prime hours';
    } else {
      timeGreeting = 'Night owl mode';
    }

    const tips = [
      { title: `${timeGreeting} unlocked`, subtitle: 'Ready to turn ideas into reality.' },
      { title: 'Flow state on deck', subtitle: 'Need a timer or quick scratchpad?' },
      { title: 'Keyboard ready', subtitle: 'Let’s crush some tasks today.' },
      { title: 'Stay hydrated, genius', subtitle: 'Deep breath. You’re doing great.' },
      { title: 'At your command', subtitle: 'Click to brainstorm, search, or automate.' },
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

    // 1. Animation Controller
    const anim = new AnimationController();
    animControllerRef.current = anim;

    // 2. Behavior Engine
    const behavior = new BehaviorEngine(anim);
    behaviorEngineRef.current = behavior;

    // 3. Sync animation state
    const unsubAnim = anim.onChange((state) => {
      setCurrentState(state);
    });

    // 4. Movement & Gaze Controller
    const move = new MovementController(containerRef.current, {
      onDragStart: () => {
        behavior.handleDragStart();
      },
      onDragEnd: () => {
        behavior.handleDragEnd();
      },
      onGazeMove: (nx, ny) => {
        setGaze({ x: nx, y: ny });
      },
      onClick: () => {
        handlePetAction();
      },
    });
    moveControllerRef.current = move;

    // 5. IPC listeners
    let unsubIpc: (() => void) | undefined;
    let unsubTimerTick: (() => void) | undefined;
    let unsubTimerComp: (() => void) | undefined;
    let unsubReminder: (() => void) | undefined;
    let unsubActivity: (() => void) | undefined;

    let reactionTimeout: NodeJS.Timeout;
    let speakingTimeout: NodeJS.Timeout;
    let typingTimeout: NodeJS.Timeout;

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

        // Typing reactivity
        if (event.isTyping) {
          setIsTyping(true);
          if (event.typingBurst) {
            setTypingBurst(true);
            SoundEffects.keyboardTap(0.2);
          } else {
            SoundEffects.keyboardTap(0.12);
          }

          if (typingTimeout) clearTimeout(typingTimeout);
          typingTimeout = setTimeout(() => {
            setIsTyping(false);
            setTypingBurst(false);
          }, 1800);
        }

        // Entering coding mode chime
        if (event.category === 'development' && event.state === 'coding') {
          SoundEffects.codeFlow(0.3);
        }

        setIsSpeaking(true);
        if (speakingTimeout) clearTimeout(speakingTimeout);
        speakingTimeout = setTimeout(() => {
          setIsSpeaking(false);
        }, 2500);

        if (reactionTimeout) clearTimeout(reactionTimeout);
        reactionTimeout = setTimeout(() => {
          setReactionMessage(null);
        }, 6000);
      });

      unsubTimerTick = window.mochiApi.onTimerTick((timer: ActiveTimerState) => {
        setActiveTimer(timer);
      });

      unsubTimerComp = window.mochiApi.onTimerCompleted(() => {
        setActiveTimer(null);
        behavior.handleTimerComplete();
      });

      unsubReminder = window.mochiApi.onReminderTriggered(() => {
        behavior.handleReminderTriggered();
      });

      // Load initial petSize from saved settings
      window.mochiApi.getInitialState().then((initial) => {
        if (initial?.settings?.petSize) {
          setPetSize(initial.settings.petSize);
        }
      }).catch(console.error);

      // Listen for settings changes (e.g. user moves size slider or picks preset)
      const unsubSettings = window.mochiApi.onStateUpdated((state) => {
        if (state.settings?.petSize) {
          setPetSize(state.settings.petSize);
        }
      });

      return () => {
        unsubAnim();
        unsubIpc?.();
        unsubTimerTick?.();
        unsubTimerComp?.();
        unsubReminder?.();
        unsubActivity?.();
        unsubSettings?.();
        if (reactionTimeout) clearTimeout(reactionTimeout);
        if (speakingTimeout) clearTimeout(speakingTimeout);
        if (typingTimeout) clearTimeout(typingTimeout);
        move.destroy();
        anim.destroy();
        behavior.destroy();
      };
    }

    return () => {
      unsubAnim();
      move.destroy();
      anim.destroy();
      behavior.destroy();
    };
  }, [orbMode]);

  const isTimerRunning = activeTimer && activeTimer.status === 'running';
  const timerProgress =
    isTimerRunning && activeTimer.totalDurationSeconds > 0
      ? 1 - activeTimer.remainingSeconds / activeTimer.totalDurationSeconds
      : 0;

  return (
    <div
      className="mochi-pet-window"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Apple Dynamic Island Floating Context Pill - Showing fun text alone */}
      {(isHovered || reactionMessage) && (
        <div
          className="mochi-speech-bubble"
          onClick={handlePetAction}
          title="Click to open Mochi Assistant"
        >
          <div className="bubble-status-dot" data-state={currentState} />
          <div className="bubble-body">
            <div className="bubble-text">
              {reactionMessage ? (reactionMessage.subtitle || reactionMessage.title) : greeting.title}
            </div>
            {isHovered && !reactionMessage && (
              <div className="bubble-hint">{greeting.subtitle}</div>
            )}
          </div>
          <div className="bubble-actions">
            <span className="bubble-badge">⌘ Space</span>
            <button
              className="bubble-power-btn"
              onClick={handleQuit}
              title="Quit App"
            >
              <Power size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Holographic Timer Badge */}
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

      {/* Living Mascot Canvas Container */}
      <div
        ref={containerRef}
        className={`mochi-orb-canvas-container ${isHovered || reactionMessage ? 'hovered' : ''}`}
        title="Mochi Companion (Click to open assistant, drag to move)"
      >
        {orbMode === 'glow-lava' ? (
          <GlowLavaOrb
            state={currentState}
            isSpeaking={isSpeaking}
            isTyping={isTyping}
            typingBurst={typingBurst}
            gaze={gaze}
            isTimerActive={isTimerRunning}
            timerProgress={timerProgress}
            size={petSize}
          />
        ) : (
          <ParticlesOrb
            state={mapPetStateToOrbState(currentState)}
            size={Math.round(petSize * 0.98)}
            speed={1}
            colorFrom="#f0abfc"
            colorTo="#818cf8"
          />
        )}
      </div>

      {/* Apple-grade HUD Pill below Mochi */}
      <div className={`mochi-hover-pill ${isHovered || reactionMessage ? 'visible' : ''}`}>
        <span className="mochi-dot" data-state={currentState} />
        <span className="mochi-label">
          {isTyping && currentState === 'coding'
            ? 'CODING FLOW'
            : isTyping
            ? 'FAST TYPING'
            : currentState.toUpperCase()}
        </span>
        <button
          className="mochi-mode-toggle-btn"
          onClick={(e) => {
            e.stopPropagation();
            setOrbMode((prev) => (prev === 'glow-lava' ? 'particles' : 'glow-lava'));
          }}
          title="Switch between Cyber Mascot and Particle Orb"
        >
          <Sparkles size={10} />
          <span>{orbMode === 'glow-lava' ? 'Cyber Mascot' : 'Particles'}</span>
        </button>
        <button
          className="mochi-turn-off-btn"
          onClick={handleQuit}
          title="Quit Mochi"
        >
          <Power size={10} />
          <span>Quit</span>
        </button>
      </div>
    </div>
  );
};
