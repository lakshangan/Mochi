import React, { useEffect, useRef, useState } from 'react';
import { MochiOrbScene } from '../graphics/orb-scene';
import { FallbackOrbRenderer } from '../graphics/fallback-renderer';
import { MovementController } from '../engine/movement-controller';
import { AnimationController } from '../engine/animation-controller';
import { BehaviorEngine } from '../engine/behavior-engine';
import { PetAnimationState } from '../../shared/types';
import { SoundEffects } from '../../shared/sound-effects';
import { Power } from 'lucide-react';

export const OrbPet: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MochiOrbScene | FallbackOrbRenderer | null>(null);
  const animControllerRef = useRef<AnimationController | null>(null);
  const behaviorEngineRef = useRef<BehaviorEngine | null>(null);
  const moveControllerRef = useRef<MovementController | null>(null);

  const [currentState, setCurrentState] = useState<PetAnimationState>('idle');
  const [isHovered, setIsHovered] = useState(false);
  const [greeting, setGreeting] = useState<{ title: string; subtitle: string }>({
    title: 'Hello there.',
    subtitle: 'Click me to open your assistant.',
  });
  const [reactionMessage, setReactionMessage] = useState<{ title: string; subtitle: string } | null>(null);

  // New useEffect to show temporary speech bubble based on system activity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (currentState === 'typing') {
      setReactionMessage({ title: 'Typing away...', subtitle: 'What are you writing?' });
      timeout = setTimeout(() => setReactionMessage(null), 5000);
    } else if (currentState === 'coding') {
      setReactionMessage({ title: 'Coding Session', subtitle: 'Writing some awesome code!' });
      timeout = setTimeout(() => setReactionMessage(null), 5000);
    } else if (currentState === 'listening') {
      setReactionMessage({ title: 'Jamming Out ♫', subtitle: 'Listening to a good song?' });
      timeout = setTimeout(() => setReactionMessage(null), 5000);
    } else if (currentState === 'sleeping') {
      setReactionMessage({ title: 'Zzz...', subtitle: 'Taking a quick nap.' });
      timeout = setTimeout(() => setReactionMessage(null), 5000);
    } else {
      setReactionMessage(null);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [currentState]);

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
      { title: `${timeGreeting}.`, subtitle: 'I am here if you need to focus or take a break.' },
      { title: 'Welcome back.', subtitle: 'Let me know how I can help you today.' },
      { title: 'Hello there.', subtitle: 'Remember to stay hydrated and take short breaks.' },
      { title: 'Focus mode.', subtitle: 'Ready to start a deep work session when you are.' },
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    setGreeting(getDynamicGreeting());
    animControllerRef.current?.triggerReaction('happy', 2500);
    SoundEffects.chirp(0.25);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handlePetAction = () => {
    behaviorEngineRef.current?.handlePetClick();
    SoundEffects.chirp(0.45);
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

    // 3. Initialize 3D Scene with WebGL fallback
    try {
      const scene = new MochiOrbScene(containerRef.current);
      sceneRef.current = scene;
    } catch (err) {
      console.warn('[OrbPet] WebGL init failed, falling back to 2D Canvas:', err);
      const fallback = new FallbackOrbRenderer(containerRef.current);
      sceneRef.current = fallback;
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

    // 6. Listen to main process IPC pet state triggers
    let unsubIpc: (() => void) | undefined;
    let unsubTimerComp: (() => void) | undefined;
    let unsubReminder: (() => void) | undefined;

    if (window.mochiApi) {
      unsubIpc = window.mochiApi.onPetStateChange((state) => {
        // Continuous state update instead of a 3-second reaction
        anim.setState(state);
      });

      unsubTimerComp = window.mochiApi.onTimerCompleted(() => {
        behavior.handleTimerComplete();
      });

      unsubReminder = window.mochiApi.onReminderTriggered(() => {
        behavior.handleReminderTriggered();
      });
    }

    return () => {
      unsubAnim();
      unsubIpc?.();
      unsubTimerComp?.();
      unsubReminder?.();
      move.destroy();
      anim.destroy();
      behavior.destroy();
      sceneRef.current?.destroy();
    };
  }, []);

  return (
    <div
      className="mochi-pet-window"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Interactive Apple-Style Floating Welcome Speech Bubble */}
      {(isHovered || reactionMessage) && (
        <div
          className="mochi-speech-bubble"
          onClick={handlePetAction}
          title="Click to open Mochi Assistant"
        >
          <div className="bubble-body">
            <div className="bubble-title">{reactionMessage ? reactionMessage.title : greeting.title}</div>
            <div className="bubble-subtitle">{reactionMessage ? reactionMessage.subtitle : greeting.subtitle}</div>
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

      {/* 3D Orb Canvas */}
      <div
        ref={containerRef}
        className={`mochi-orb-canvas-container ${(isHovered || reactionMessage) ? 'hovered' : ''}`}
        title="Mochi Companion (Click to open assistant, drag to move)"
      />

      {/* Sleek status & quick Turn Off pill below Mochi */}
      <div className={`mochi-hover-pill ${(isHovered || reactionMessage) ? 'visible' : ''}`}>
        <span className="mochi-dot" />
        <span className="mochi-label">{currentState.toUpperCase()}</span>
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
