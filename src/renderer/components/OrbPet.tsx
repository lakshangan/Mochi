import React, { useEffect, useRef, useState } from 'react';
import { MovementController } from '../engine/movement-controller';
import { AnimationController } from '../engine/animation-controller';
import { BehaviorEngine } from '../engine/behavior-engine';
import { PetAnimationState, SystemActivityEvent, ActiveTimerState } from '../../shared/types';
import { SoundEffects } from '../../shared/sound-effects';
import {
  Power,
  Timer as TimerIcon,
  Sparkles,
  Droplet,
  Coffee,
  Cookie,
  Heart,
  Eye,
  Maximize2,
  Minimize2,
  Music,
  Flame,
  GitBranch,
} from 'lucide-react';
import { ParticlesOrb } from '@/registry/orbe/particles-orb/particles-orb';
import { GlowLavaOrb } from './GlowLavaOrb';
import { ConfettiEffect } from './ConfettiEffect';
import { EyeReliefGuide } from './EyeReliefGuide';
import { SoundscapeService } from '../services/soundscape-service';
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
  const [userName, setUserName] = useState<string>('');
  const [customMatrix, setCustomMatrix] = useState<number[][] | undefined>(undefined);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const userNameRef = useRef(userName);

  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  const [isHovered, setIsHovered] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingBurst, setTypingBurst] = useState(false);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(null);
  const [greeting, setGreeting] = useState<{ title: string; subtitle: string }>({
    title: 'Ready to build ✨',
    subtitle: 'Click me anytime to open assistant.',
  });
  const [reactionMessage, setReactionMessage] = useState<{
    title: string;
    subtitle: string;
    appName?: string;
  } | null>(null);

  // Next-Gen Interactive States
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDynamicIsland, setIsDynamicIsland] = useState(false);
  const [showTreats, setShowTreats] = useState(false);
  const [showEyeRelief, setShowEyeRelief] = useState(false);
  const [loveMeter, setLoveMeter] = useState(0);
  const [showLoveWave, setShowLoveWave] = useState(false);
  const [squashScale, setSquashScale] = useState({ x: 1, y: 1 });
  const [soundscapePreset, setSoundscapePreset] = useState<string>('off');

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDynamicGreeting = (name = userName) => {
    const tips = name
      ? [
          { title: `Hey ${name}! What's up? ✨`, subtitle: 'Floating right beside you.' },
          { title: `Ready to build, ${name}? 🚀`, subtitle: 'System optimal & ready.' },
          { title: `Flow state on deck, ${name}!`, subtitle: 'Zero distractions.' },
          { title: `Stay hydrated, ${name}! 💧`, subtitle: 'Keep that energy high.' },
          { title: `Pure momentum, ${name}! ⚡`, subtitle: 'Crushing goals today.' },
        ]
      : [
          { title: 'Ready to build 🚀', subtitle: 'System optimal & ready.' },
          { title: 'Flow state on deck ✨', subtitle: 'Zero distractions.' },
          { title: 'Stay hydrated 💧', subtitle: 'Grab some water.' },
          { title: 'Pure momentum ⚡', subtitle: 'Click to open assistant.' },
        ];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  const handlePetMouseMove = () => {
    // Stroking / petting the orb fills the love meter
    setLoveMeter((prev) => {
      const next = prev + 4;
      if (next >= 100) {
        SoundEffects.purr(0.35);
        setShowLoveWave(true);
        setTimeout(() => setShowLoveWave(false), 2400);
        setReactionMessage({
          title: 'Mochi loves you! 🥰✨',
          subtitle: 'So warm & cozy! Love meter 100% full.',
        });
        setTimeout(() => setReactionMessage(null), 4000);
        return 0;
      }
      return next;
    });
  };

  const handleFeedTreat = (treat: 'espresso' | 'cookie' | 'water') => {
    if (treat === 'espresso') {
      SoundEffects.treatEat(0.3);
      animControllerRef.current?.triggerReaction('fire', 6000);
      setReactionMessage({
        title: 'Espresso Surge! ☕🔥',
        subtitle: 'Turbo coding speed online! Caffeine overdrive.',
      });
    } else if (treat === 'cookie') {
      SoundEffects.treatEat(0.3);
      animControllerRef.current?.triggerReaction('happy', 5000);
      setReactionMessage({
        title: 'Delicious Mochi Cookie! 🍪✨',
        subtitle: 'Mmm, sweet fuel for deep focus.',
      });
    } else if (treat === 'water') {
      SoundEffects.waterDrop(0.35);
      animControllerRef.current?.triggerReaction('hydrated', 6000);
      if (window.mochiApi) {
        window.mochiApi.completeWater();
      }
      setReactionMessage({
        title: 'Hydrated & Crisp! 💧✨',
        subtitle: '250ml logged. Body & mind refreshed!',
      });
    }
    setShowTreats(false);
    setTimeout(() => setReactionMessage(null), 5000);
  };

  const handleCycleSoundscape = () => {
    const sequence = ['off', 'rain', 'cafe', 'forest', 'binaural'];
    const curr = SoundscapeService.getCurrentPreset();
    const nextIdx = (sequence.indexOf(curr) + 1) % sequence.length;
    const nextPreset = sequence[nextIdx] as any;
    SoundscapeService.play(nextPreset);
    setSoundscapePreset(nextPreset);
    SoundEffects.chirp(0.2);
    setReactionMessage({
      title: nextPreset === 'off' ? 'Soundscapes Paused' : `Soundscape: ${nextPreset.toUpperCase()} 🎵`,
      subtitle: nextPreset === 'off' ? 'Ambient focus sound muted.' : 'Procedural lo-fi background active.',
    });
    setTimeout(() => setReactionMessage(null), 3000);
  };

  const handleToggleIsland = () => {
    SoundEffects.whoosh(0.25);
    setIsDynamicIsland((prev) => !prev);
  };

  const handleQuickTimerToggle = () => {
    SoundEffects.chirp(0.25);
    if (isTimerRunning) {
      if (window.mochiApi) window.mochiApi.pauseTimer();
    } else {
      if (window.mochiApi) window.mochiApi.startPomodoro('focus');
    }
  };

  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setGreeting(getDynamicGreeting(userName));
    animControllerRef.current?.triggerReaction('happy', 2500);
    // Silent on hover so simply moving mouse does not cause audio interruption
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    setUserName(trimmed);
    userNameRef.current = trimmed;
    setShowOnboarding(false);
    if (window.mochiApi) {
      await window.mochiApi.saveSettings({ userName: trimmed, hasSeenWelcome: true });
    }
    SoundEffects.celebrate(0.3);
    animControllerRef.current?.triggerReaction('celebrating', 4000);
    setReactionMessage({
      title: 'Awesome to meet you! ✨',
      subtitle: `Hey ${trimmed}! What's up? I'm right here with you.`,
    });
    setTimeout(() => {
      setReactionMessage(null);
    }, 6000);
  };

  const handlePetAction = () => {
    tapCountRef.current += 1;

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
    }

    if (tapCountRef.current === 1) {
      // 1 Tap: Wait briefly to see if user double-taps
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
        behaviorEngineRef.current?.handlePetClick();
        SoundEffects.chirp(0.25);
        if (window.mochiApi) {
          window.mochiApi.toggleAssistant();
        }
      }, 280);
    } else if (tapCountRef.current === 2) {
      // 2 Taps: Wait briefly to see if user triple-taps
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
        SoundEffects.bonk(0.28);
        animControllerRef.current?.triggerReaction('beaten', 6500);
        if (window.mochiApi) {
          window.mochiApi.triggerPetReaction('beaten');
        }
        setReactionMessage({
          title: 'Ouch! >_<',
          subtitle: 'Why tap so hard? Mochi feels dizzy & bruised! 🤕',
        });
        setTimeout(() => {
          setReactionMessage(null);
        }, 6500);
      }, 260);
    } else if (tapCountRef.current >= 3) {
      // 3 Taps: Cool cyber party / sunglasses / hyper-drive!
      tapCountRef.current = 0;
      SoundEffects.party(0.35);
      animControllerRef.current?.triggerReaction('party', 7500);
      if (window.mochiApi) {
        window.mochiApi.triggerPetReaction('party');
      }
      setReactionMessage({
        title: '🕶️ HYPER-DRIVE ACTIVATED! ✨',
        subtitle: 'Maximum energy! Ultra-chill cyber mode online 🚀⚡',
      });
      setTimeout(() => {
        setReactionMessage(null);
      }, 7500);
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
        setSquashScale({ x: 1.14, y: 0.86 });
      },
      onDragEnd: () => {
        behavior.handleDragEnd();
        setSquashScale({ x: 0.88, y: 1.12 });
        setTimeout(() => setSquashScale({ x: 1, y: 1 }), 220);
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
    let unsubGaze: (() => void) | undefined;
    let unsubGit: (() => void) | undefined;

    let reactionTimeout: NodeJS.Timeout;
    let speakingTimeout: NodeJS.Timeout;
    let typingTimeout: NodeJS.Timeout;

    if (window.mochiApi) {
      if (window.mochiApi.onGazeUpdate) {
        unsubGaze = window.mochiApi.onGazeUpdate((newGaze) => {
          setGaze(newGaze);
        });
      }

      unsubIpc = window.mochiApi.onPetStateChange((state) => {
        anim.setState(state);
        const currentName = userNameRef.current;
        if (state === 'hydrated') {
          setReactionMessage({
            title: 'Hydrated! 💧💖',
            subtitle: currentName
              ? `Great job staying refreshed, ${currentName}!`
              : 'Water logged! Body & mind energized.',
          });
          setIsSpeaking(true);
          if (reactionTimeout) clearTimeout(reactionTimeout);
          reactionTimeout = setTimeout(() => setReactionMessage(null), 8500);
          if (speakingTimeout) clearTimeout(speakingTimeout);
          speakingTimeout = setTimeout(() => setIsSpeaking(false), 4500);
        } else if (state === 'angry') {
          setReactionMessage({
            title: 'Drink your water! 😠💧',
            subtitle: currentName
              ? `Stay hydrated, ${currentName}! Skipping water isn't good for you.`
              : "Drink your water! Skipping hydration isn't healthy.",
          });
          setIsSpeaking(true);
          if (reactionTimeout) clearTimeout(reactionTimeout);
          reactionTimeout = setTimeout(() => setReactionMessage(null), 8500);
          if (speakingTimeout) clearTimeout(speakingTimeout);
          speakingTimeout = setTimeout(() => setIsSpeaking(false), 4500);
        } else if (state === 'beaten') {
          setReactionMessage({
            title: 'Ouch! >_<',
            subtitle: 'Why tap so hard? Mochi feels dizzy & bruised! 🤕',
          });
          setIsSpeaking(true);
          if (reactionTimeout) clearTimeout(reactionTimeout);
          reactionTimeout = setTimeout(() => setReactionMessage(null), 7000);
          if (speakingTimeout) clearTimeout(speakingTimeout);
          speakingTimeout = setTimeout(() => setIsSpeaking(false), 4000);
        } else if (state === 'party') {
          setReactionMessage({
            title: '🕶️ HYPER-DRIVE ACTIVATED! ✨',
            subtitle: 'Maximum energy! Ultra-chill cyber mode online 🚀⚡',
          });
          setIsSpeaking(true);
          if (reactionTimeout) clearTimeout(reactionTimeout);
          reactionTimeout = setTimeout(() => setReactionMessage(null), 7500);
          if (speakingTimeout) clearTimeout(speakingTimeout);
          speakingTimeout = setTimeout(() => setIsSpeaking(false), 4000);
        } else if (state === 'smile') {
          setReactionMessage({
            title: 'Keep smiling :) ✨',
            subtitle: currentName
              ? `Your positivity shines bright, ${currentName}!`
              : 'Positive energy unlocked!',
          });
          setIsSpeaking(true);
          if (reactionTimeout) clearTimeout(reactionTimeout);
          reactionTimeout = setTimeout(() => setReactionMessage(null), 5000);
          if (speakingTimeout) clearTimeout(speakingTimeout);
          speakingTimeout = setTimeout(() => setIsSpeaking(false), 2500);
        } else if (state === 'sad') {
          setReactionMessage({
            title: 'Feeling down? :(',
            subtitle: currentName
              ? `Take a breath, ${currentName}. I'm right here with you.`
              : "Take a breath. I'm right here with you.",
          });
          setIsSpeaking(true);
          if (reactionTimeout) clearTimeout(reactionTimeout);
          reactionTimeout = setTimeout(() => setReactionMessage(null), 5000);
          if (speakingTimeout) clearTimeout(speakingTimeout);
        } else if (state === 'fire') {
          setReactionMessage({
            title: 'On Fire! 🔥',
            subtitle: currentName
              ? `Blazing typing streak, ${currentName}! You are unstoppable 🔥`
              : 'Blazing typing streak! You are in the zone 🔥',
          });
          setIsSpeaking(true);
          if (reactionTimeout) clearTimeout(reactionTimeout);
          reactionTimeout = setTimeout(() => setReactionMessage(null), 5000);
          if (speakingTimeout) clearTimeout(speakingTimeout);
          speakingTimeout = setTimeout(() => setIsSpeaking(false), 2500);
        } else if (state === 'coding') {
          setReactionMessage({
            title: 'Code Flow </>',
            subtitle: currentName
              ? `Crafting software with you, ${currentName}! </>`
              : 'Crafting clean software </>',
          });
          setIsSpeaking(true);
          if (reactionTimeout) clearTimeout(reactionTimeout);
          reactionTimeout = setTimeout(() => setReactionMessage(null), 5000);
          if (speakingTimeout) clearTimeout(speakingTimeout);
          speakingTimeout = setTimeout(() => setIsSpeaking(false), 2500);
        }
      });

      unsubActivity = window.mochiApi.onSystemActivity((event: SystemActivityEvent) => {
        const currentName = userNameRef.current;
        let finalSubtitle = event.subtitle;
        if (event.state === 'listening' && !event.subtitle) {
          finalSubtitle = currentName
            ? `Vibing to the beat with you, ${currentName}! 🎧`
            : 'Headphones on & vibing to the beat 🎧';
        }

        setReactionMessage({
          title: event.title,
          subtitle: finalSubtitle,
          appName: event.appName,
        });

        // Typing reactivity (visual only, completely silent without keyboard audio)
        if (event.isTyping) {
          setIsTyping(true);
          if (event.typingBurst) {
            setTypingBurst(true);
          }

          if (typingTimeout) clearTimeout(typingTimeout);
          typingTimeout = setTimeout(() => {
            setIsTyping(false);
            setTypingBurst(false);
          }, 1800);
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

      // Load initial petSize, userName, and customOrbMatrix from saved settings
      window.mochiApi.getInitialState().then((initial) => {
        if (initial?.settings?.petSize) {
          setPetSize(initial.settings.petSize);
        }
        if (initial?.settings?.useCustomOrbMatrix && initial?.settings?.customOrbMatrix) {
          setCustomMatrix(initial.settings.customOrbMatrix);
        } else {
          setCustomMatrix(undefined);
        }
        if (initial?.settings?.userName) {
          const storedName = initial.settings.userName;
          setUserName(storedName);
          userNameRef.current = storedName;
          // Cinematic friendly welcome sequence on startup!
          SoundEffects.chime(0.35);
          anim.triggerReaction('happy', 3500);
          setReactionMessage({
            title: `Welcome back! ✨`,
            subtitle: `Hey ${storedName}! What's up? Ready to build ✨`,
          });
          reactionTimeout = setTimeout(() => {
            setReactionMessage(null);
          }, 6500);
        } else {
          // First-time friendly onboarding
          setShowOnboarding(true);
        }
      }).catch(console.error);

      // Listen for settings changes (e.g. user moves size slider, changes name, or toggles custom orb face)
      const unsubSettings = window.mochiApi.onStateUpdated((state) => {
        if (state.settings?.petSize) {
          setPetSize(state.settings.petSize);
        }
        if (state.settings?.useCustomOrbMatrix && state.settings?.customOrbMatrix) {
          setCustomMatrix(state.settings.customOrbMatrix);
        } else if (state.settings?.useCustomOrbMatrix === false) {
          setCustomMatrix(undefined);
        }
        if (state.settings?.userName !== undefined) {
          setUserName(state.settings.userName);
          userNameRef.current = state.settings.userName;
        }
      });

      if (window.mochiApi.onGitEvent) {
        unsubGit = window.mochiApi.onGitEvent((ev: any) => {
          if (ev.type === 'commit' || ev.type === 'push') {
            setShowConfetti(true);
            SoundEffects.gitCommit(0.35);
            anim.triggerReaction('celebrating', 5000);
            setReactionMessage({
              title: ev.type === 'commit' ? 'Git Commit! 🚀' : 'Code Pushed! 🌟',
              subtitle: ev.message,
            });
            if (reactionTimeout) clearTimeout(reactionTimeout);
            reactionTimeout = setTimeout(() => setReactionMessage(null), 6500);
          } else if (ev.type === 'fatigue_warning') {
            anim.triggerReaction('reminding', 6000);
            setReactionMessage({
              title: '90m Straight Coding Alert! 🧘',
              subtitle: ev.message,
            });
            if (reactionTimeout) clearTimeout(reactionTimeout);
            reactionTimeout = setTimeout(() => setReactionMessage(null), 8500);
          }
        });
      }

      return () => {
        unsubAnim();
        unsubIpc?.();
        unsubTimerTick?.();
        unsubTimerComp?.();
        unsubReminder?.();
        unsubActivity?.();
        unsubGaze?.();
        unsubSettings?.();
        unsubGit?.();
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

  const bubbleScale = Math.min(1, Math.max(0.85, petSize / 115));

  return (
    <div
      className="mochi-pet-window"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <EyeReliefGuide isOpen={showEyeRelief} onClose={() => setShowEyeRelief(false)} />

      {/* Dynamic Island Pill Mode */}
      {isDynamicIsland ? (
        <div
          className="mochi-dynamic-island-pill"
          onClick={handleToggleIsland}
          title="Dynamic Island Mode (Click to expand into full companion)"
        >
          <div className="island-orb-preview">
            <GlowLavaOrb
              state={currentState}
              isSpeaking={isSpeaking}
              size={26}
            />
          </div>
          <div className="island-center-content">
            {isTimerRunning ? (
              <div className="island-timer-row">
                <span className="island-time">{formatTime(activeTimer.remainingSeconds)}</span>
                <span className="island-chip">{activeTimer.label || 'FOCUS'}</span>
              </div>
            ) : (
              <div className="island-text-row">
                <span className="island-title">{userName ? `Mochi • ${userName}` : 'Mochi Flow'}</span>
                <span className="island-desc">Ready to build ✨</span>
              </div>
            )}
          </div>
          <button
            className="island-expand-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleIsland();
            }}
            title="Expand to Orb"
          >
            <Maximize2 size={12} />
          </button>
        </div>
      ) : (
        <div
          className="mochi-pet-stage"
          style={{
            width: petSize,
            height: petSize,
          }}
        >
          {/* Floating Capsule / Speech Bubble / Onboarding Anchor - directly hugs top of orb */}
          <div
            className="mochi-bubble-anchor"
            style={{
              transform: `translateX(-50%) scale(${bubbleScale})`,
              transformOrigin: 'bottom center',
            }}
          >
            {showOnboarding ? (
              <form
                className="mochi-onboarding-capsule"
                onSubmit={handleSaveName}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <span className="onboarding-sparkle">✨</span>
                <input
                  type="text"
                  className="onboarding-input"
                  placeholder="Your name? (e.g. Alex)"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  autoFocus
                  maxLength={20}
                />
                <button type="submit" className="onboarding-submit-btn" title="Save name">
                  ✓
                </button>
              </form>
            ) : (isHovered || reactionMessage) ? (
              <div
                className="mochi-speech-bubble"
                onClick={handlePetAction}
                onMouseDown={(e) => e.stopPropagation()}
                title="Click to open Mochi Assistant"
              >
                <div className="bubble-status-dot" data-state={currentState} />

                {/* Integrated Live Timer Chip inside capsule */}
                {isTimerRunning && (
                  <div className="bubble-timer-chip">
                    <TimerIcon size={11} className="timer-chip-icon" />
                    <span>{formatTime(activeTimer.remainingSeconds)}</span>
                    <span className="timer-chip-label">{activeTimer.label || 'FOCUS'}</span>
                  </div>
                )}

                <div className="bubble-body">
                  <span className="bubble-text">
                    {reactionMessage ? (reactionMessage.subtitle || reactionMessage.title) : greeting.title}
                  </span>
                </div>
              </div>
            ) : isTimerRunning ? (
              /* Holographic Timer Badge - ONLY shown when speech bubble is NOT visible */
              <div
                className="mochi-timer-hologram-pill"
                onClick={handlePetAction}
                onMouseDown={(e) => e.stopPropagation()}
                title="Click to open timer controls"
              >
                <span className="timer-hologram-dot" />
                <TimerIcon size={12} className="timer-hologram-icon" />
                <span className="timer-hologram-time">{formatTime(activeTimer.remainingSeconds)}</span>
                <span className="timer-hologram-label">{activeTimer.label || 'FOCUS'}</span>
              </div>
            ) : null}
          </div>

          {/* Quick-Action Hover HUD Dock */}
          {isHovered && !showOnboarding && (
            <div className="mochi-hover-hud" onMouseDown={(e) => e.stopPropagation()}>
              <button
                onClick={handleQuickTimerToggle}
                className="hud-pill-btn"
                title={isTimerRunning ? 'Pause Timer' : 'Start Focus Pomodoro'}
              >
                <TimerIcon size={12} />
                <span>{isTimerRunning ? 'Pause' : 'Focus'}</span>
              </button>
              <button
                onClick={() => handleFeedTreat('water')}
                className="hud-pill-btn"
                title="Quick Log 250ml Water"
              >
                <Droplet size={12} />
                <span>+250ml</span>
              </button>
              <button
                onClick={handleCycleSoundscape}
                className={`hud-pill-btn ${soundscapePreset !== 'off' ? 'active-glow' : ''}`}
                title={`Soundscape: ${soundscapePreset.toUpperCase()}`}
              >
                <Music size={12} />
              </button>
              <button
                onClick={() => setShowTreats(!showTreats)}
                className="hud-pill-btn"
                title="Treats & Food"
              >
                <Cookie size={12} />
              </button>
              <button
                onClick={() => setShowEyeRelief(true)}
                className="hud-pill-btn"
                title="20-20-20 Eye Exercise"
              >
                <Eye size={12} />
              </button>
              <button
                onClick={handleToggleIsland}
                className="hud-pill-btn"
                title="Snap to Dynamic Island Pill"
              >
                <Minimize2 size={12} />
              </button>
            </div>
          )}

          {/* Treats Drawer */}
          {showTreats && (
            <div className="mochi-treats-drawer" onMouseDown={(e) => e.stopPropagation()}>
              <button onClick={() => handleFeedTreat('espresso')} className="treat-item-btn" title="Espresso Surge (+25 XP)">
                ☕ <span>Espresso</span>
              </button>
              <button onClick={() => handleFeedTreat('cookie')} className="treat-item-btn" title="Sweet Cookie (+20 XP)">
                🍪 <span>Cookie</span>
              </button>
              <button onClick={() => handleFeedTreat('water')} className="treat-item-btn" title="Fresh Water (+30 XP)">
                💧 <span>Water</span>
              </button>
            </div>
          )}

          {/* Floating Love Heart Wave */}
          {showLoveWave && (
            <div className="mochi-love-wave">
              <span>💖</span>
              <span>🥰</span>
              <span>💖</span>
            </div>
          )}

          {/* Living Mascot Canvas Container with Spring Jelly Physics */}
          <div
            ref={containerRef}
            className={`mochi-orb-canvas-container ${isHovered || reactionMessage ? 'hovered' : ''}`}
            style={{
              width: petSize,
              height: petSize,
              transform: `scale(${squashScale.x}, ${squashScale.y}) translate(${gaze.x * 6}px, ${gaze.y * 6}px)`,
              transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onMouseMove={handlePetMouseMove}
            title="Mochi Companion (Click to open, right-click to hide, drag to move)"
            onContextMenu={(e) => {
              e.preventDefault();
              if (window.mochiApi) {
                window.mochiApi.setPetVisible(false);
                window.mochiApi.showNotification(
                  'Deep Work Mode Active 🧘',
                  'Mochi is hidden for full-screen focus. Click the Mochi icon in your status bar at top right to restore anytime!'
                );
              }
            }}
          >
            {orbMode === 'glow-lava' ? (
              <GlowLavaOrb
                state={currentState}
                isSpeaking={isSpeaking}
                isTyping={isTyping}
                typingBurst={typingBurst}
                gaze={gaze}
                isTimerActive={Boolean(isTimerRunning)}
                timerProgress={timerProgress}
                size={petSize}
                customMatrix={customMatrix}
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
        </div>
      )}
    </div>
  );
};
