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
  EyeOff,
  Maximize2,
  Minimize2,
  Music,
  Flame,
  GitBranch,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';
import { ParticlesOrb } from '@/registry/orbe/particles-orb/particles-orb';
import { GlowLavaOrb } from './GlowLavaOrb';
import { MatrixOrb, MatrixOrbState } from './MatrixOrb';
import { IslandFluidOrb } from './IslandFluidOrb';
import { ConfettiEffect } from './ConfettiEffect';
import { EyeReliefGuide } from './EyeReliefGuide';
import { SoundscapeService } from '../services/soundscape-service';
import { AiCompanionService } from '../services/ai-service';
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
  const islandRef = useRef<HTMLDivElement>(null);
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

  // Next-Gen Interactive & Apple Motion States
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDynamicIsland, setIsDynamicIsland] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [showEyeRelief, setShowEyeRelief] = useState(false);
  const [loveMeter, setLoveMeter] = useState(0);
  const [showLoveWave, setShowLoveWave] = useState(false);
  const [squashScale, setSquashScale] = useState({ x: 1, y: 1 });
  const [isEntering, setIsEntering] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);

  // Direct Floating Orb Chat with Local Ollama AI & Matrix Wave Animations
  const [showQuickChat, setShowQuickChat] = useState(false);
  const [quickChatInput, setQuickChatInput] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [quickChatHistory, setQuickChatHistory] = useState<{ sender: 'user' | 'mochi'; text: string }[]>([]);
  const [ollamaModel, setOllamaModel] = useState<string>('llama3.2');
  const [ollamaOnline, setOllamaOnline] = useState<boolean>(false);
  const [matrixState, setMatrixState] = useState<MatrixOrbState>('idle');
  const [typingLevel, setTypingLevel] = useState<number>(0.2);
  const quickChatInputRef = useRef<HTMLInputElement>(null);
  const chatFeedRef = useRef<HTMLDivElement>(null);
  const typingDecayRef = useRef<number | null>(null);

  // Check Ollama service on startup
  useEffect(() => {
    if (window.mochiApi?.getOllamaModels) {
      window.mochiApi.getOllamaModels().then((res) => {
        if (res.available && res.models && res.models.length > 0) {
          setOllamaOnline(true);
          setOllamaModel(res.models[0]);
        }
      }).catch(() => {});
    }
  }, []);

  // Synchronize window size when pulling up or closing chat mode
  useEffect(() => {
    if (window.mochiApi?.setPetChatExpanded) {
      window.mochiApi.setPetChatExpanded(showQuickChat);
    }
    if (showQuickChat) {
      setMatrixState('listening');
      setTypingLevel(0.35);
      setTimeout(() => quickChatInputRef.current?.focus(), 120);
    } else {
      setMatrixState('idle');
      setTypingLevel(0.2);
    }
  }, [showQuickChat]);

  // Auto-scroll chat feed to bottom on new messages
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [quickChatHistory, isChatThinking]);

  // Close chat on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showQuickChat) {
        setShowQuickChat(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showQuickChat]);

  // Handle typing to trigger real-time reactive wave bursts across the Matrix Orb dots
  const handleQuickChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuickChatInput(e.target.value);
    setTypingLevel(0.85); // Energize wave amplitude
    if (typingDecayRef.current) cancelAnimationFrame(typingDecayRef.current);
    const start = performance.now();
    const decay = (now: number) => {
      const elapsed = now - start;
      if (elapsed < 600) {
        setTypingLevel(0.85 - (elapsed / 600) * 0.55);
        typingDecayRef.current = requestAnimationFrame(decay);
      } else {
        setTypingLevel(0.3);
      }
    };
    typingDecayRef.current = requestAnimationFrame(decay);
  };

  // Apple-style entrance animation and chime on startup
  useEffect(() => {
    SoundEffects.appleChime(0.3);
    const enterTimer = setTimeout(() => {
      setIsEntering(false);
    }, 650);
    return () => clearTimeout(enterTimer);
  }, []);

  const handleSendQuickChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = quickChatInput.trim();
    if (!prompt || isChatThinking) return;

    const userMessage = { sender: 'user' as const, text: prompt };
    const newHistory = [...quickChatHistory, userMessage];
    setQuickChatHistory(newHistory);
    setQuickChatInput('');
    setIsChatThinking(true);

    // Switch Matrix Orb into fluid 3-body orbital heat wave thinking animation
    setMatrixState('thinking');
    SoundEffects.tap(0.2);

    try {
      let replyText = '';
      if (window.mochiApi?.queryAi) {
        const aiResult = await window.mochiApi.queryAi(prompt, newHistory);
        if (aiResult?.text) {
          replyText = aiResult.text;
          if (aiResult.model) setOllamaModel(aiResult.model);
          setOllamaOnline(true);
        } else if (aiResult?.error) {
          // Graceful local heuristic fallback
          const fallback = await AiCompanionService.generateResponse(prompt, newHistory as any, { provider: 'offline-local' });
          replyText = `${fallback.text}\n\n*(Local Ollama notice: ${aiResult.error})*`;
        }
      } else {
        const fallback = await AiCompanionService.generateResponse(prompt, newHistory as any, { provider: 'offline-local' });
        replyText = fallback.text;
      }

      // Ollama replied! Trigger wave response animation & sound effect
      setIsChatThinking(false);
      setMatrixState('listening');
      setTypingLevel(0.75);
      setIsSpeaking(true);
      SoundEffects.chirp(0.35);

      setQuickChatHistory((prev) => [...prev, { sender: 'mochi', text: replyText }]);

      setTimeout(() => {
        setIsSpeaking(false);
        setTypingLevel(0.25);
      }, 5000);
    } catch {
      setIsChatThinking(false);
      setMatrixState('listening');
      setQuickChatHistory((prev) => [
        ...prev,
        { sender: 'mochi', text: "My thoughts wandered for a second. Ask me again! ✨" },
      ]);
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDynamicGreeting = (name = userName) => {
    const tips = name
      ? [
          { title: `Hey ${name}! How are you feeling today? ✨`, subtitle: 'Floating right beside you.' },
          { title: `Ready to get in the zone, ${name}? 🚀`, subtitle: 'Take things one step at a time.' },
          { title: `Loving this momentum, ${name}! ✨`, subtitle: 'Zero distractions today.' },
          { title: `Stay hydrated, ${name}! 💧`, subtitle: 'A quick sip of water keeps energy high.' },
          { title: `Take a deep breath, ${name} 🌿`, subtitle: 'Relax your shoulders and breathe.' },
          { title: `I'm right here with you, ${name} 😊`, subtitle: 'Click me anytime to open assistant.' },
          { title: `Deep work mode on deck, ${name} ⚡`, subtitle: 'Let’s build something great.' },
          { title: `Remember to blink & stretch, ${name} 🍃`, subtitle: 'Resting is part of high performance.' },
        ]
      : [
          { title: 'Hey there! How is your focus today? ✨', subtitle: 'Floating right beside you.' },
          { title: 'Flow state on deck 🚀', subtitle: 'Take things one step at a time.' },
          { title: 'Stay refreshed & hydrated 💧', subtitle: 'Grab a quick sip of water.' },
          { title: 'Take a deep breath 🌿', subtitle: 'Relax your shoulders and breathe.' },
          { title: 'Ready to build something awesome? ✨', subtitle: 'Click me anytime to open assistant.' },
          { title: 'Posture check! Relax your shoulders 🍃', subtitle: 'Mindful rest keeps energy high.' },
        ];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  const handlePetMouseMove = () => {
    // Stroking / petting the orb fills the love meter
    setLoveMeter((prev) => {
      const next = prev + 5;
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

  const handleToggleIsland = () => {
    setIsDynamicIsland((prev) => {
      const next = !prev;
      if (!next) {
        // Expanding back to orb!
        SoundEffects.pop(0.35);
        setIsExpanding(true);
        setTimeout(() => setIsExpanding(false), 450);
        setSquashScale({ x: 1, y: 1 });
        animControllerRef.current?.triggerReaction('happy', 2500);
        setReactionMessage({
          title: 'Back in Orb mode! ✨',
          subtitle: 'Ready to build alongside you.',
        });
        setTimeout(() => setReactionMessage(null), 3500);
      } else {
        // Snapping into minimal pill mode
        SoundEffects.whoosh(0.25);
      }
      return next;
    });
  };

  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setGreeting(getDynamicGreeting(userName));
    animControllerRef.current?.triggerReaction('happy', 2500);
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
      subtitle: `Hey ${trimmed}! I'm right here beside you.`,
    });
    setTimeout(() => {
      setReactionMessage(null);
    }, 6000);
  };

  const handleGracefulQuit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isExiting) return;
    setIsExiting(true);
    animControllerRef.current?.triggerReaction('sleeping', 5000);
    SoundEffects.appleSleep(0.28);
    const name = userNameRef.current;
    setReactionMessage({
      title: 'Rest well! 🌙',
      subtitle: name ? `See you soon, ${name}! ✨` : 'See you soon! ✨',
    });
    setTimeout(() => {
      if (window.mochiApi) {
        window.mochiApi.quitApp();
      } else {
        window.close();
      }
    }, 420);
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
        // Show the exact wake up message and sleep/wake eyes from the photo!
        animControllerRef.current?.triggerReaction('sleeping', 3200);
        setReactionMessage({
          title: 'Waking up the assistant... 💤',
          subtitle: 'Waking up the assistant... 💤',
        });
        if (window.mochiApi) {
          window.mochiApi.toggleAssistant();
        }
        setTimeout(() => {
          setReactionMessage(null);
        }, 3600);
      }, 240);
    } else if (tapCountRef.current === 2) {
      // 2 Taps (Double-tap): Smoothly toggle between Mascot Orb and Dynamic Island Pill!
      tapCountRef.current = 0;
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      handleToggleIsland();
    } else if (tapCountRef.current >= 3) {
      // 3 Taps: Cool cyber party / sunglasses mode!
      tapCountRef.current = 0;
      SoundEffects.celebrate(0.35);
      animControllerRef.current?.triggerReaction('party', 7000);
      if (window.mochiApi) {
        window.mochiApi.triggerPetReaction('party');
      }
      setReactionMessage({
        title: '🕶️ HYPER-DRIVE ACTIVATED! ✨',
        subtitle: 'Maximum energy! Ultra-chill cyber mode online 🚀⚡',
      });
      setTimeout(() => {
        setReactionMessage(null);
      }, 7000);
    }
  };

  // 1. Persistent Animation Controller, Behavior Engine & IPC Listeners
  useEffect(() => {
    // Animation Controller
    const anim = new AnimationController();
    animControllerRef.current = anim;

    // Behavior Engine
    const behavior = new BehaviorEngine(anim);
    behaviorEngineRef.current = behavior;

    // Sync animation state
    const unsubAnim = anim.onChange((state) => {
      setCurrentState(state);
    });

    // IPC listeners
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

      let unsubPrepareQuit: (() => void) | undefined;
      if (window.mochiApi?.onPrepareQuit) {
        unsubPrepareQuit = window.mochiApi.onPrepareQuit(() => {
          handleGracefulQuit();
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
        unsubPrepareQuit?.();
        if (reactionTimeout) clearTimeout(reactionTimeout);
        if (speakingTimeout) clearTimeout(speakingTimeout);
        if (typingTimeout) clearTimeout(typingTimeout);
        anim.destroy();
        behavior.destroy();
      };
    }

    return () => {
      unsubAnim();
      anim.destroy();
      behavior.destroy();
    };
  }, []);

  // 2. Dynamic Movement & Gaze Controller (Seamlessly binds/re-binds across Orb and Pill mode)
  useEffect(() => {
    if (moveControllerRef.current) {
      moveControllerRef.current.destroy();
      moveControllerRef.current = null;
    }

    const activeEl = isDynamicIsland ? islandRef.current : containerRef.current;
    if (!activeEl) return;

    const move = new MovementController(activeEl, {
      onDragStart: () => {
        behaviorEngineRef.current?.handleDragStart();
        setSquashScale({ x: 1.14, y: 0.86 });
      },
      onDragEnd: () => {
        behaviorEngineRef.current?.handleDragEnd();
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

    return () => {
      move.destroy();
      if (moveControllerRef.current === move) {
        moveControllerRef.current = null;
      }
    };
  }, [isDynamicIsland, orbMode]);

  const isTimerRunning = activeTimer && activeTimer.status === 'running';
  const timerProgress =
    isTimerRunning && activeTimer.totalDurationSeconds > 0
      ? 1 - activeTimer.remainingSeconds / activeTimer.totalDurationSeconds
      : 0;

  const bubbleScale = Math.min(1, Math.max(0.85, petSize / 115));

  return (
    <div
      className={`mochi-pet-window ${showQuickChat ? 'chat-expanded' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        if (contextMenuPos) setContextMenuPos(null);
      }}
    >
      <ConfettiEffect active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <EyeReliefGuide isOpen={showEyeRelief} onClose={() => setShowEyeRelief(false)} />

      {/* Futuristic Holo-Chat Pull-Up Console (Rendered side-by-side with the Matrix Orb) */}
      {showQuickChat && (
        <div
          className="mochi-holo-chat-console"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Holo Header */}
          <div className="holo-console-header">
            <div className="holo-header-info">
              <span className={`holo-status-dot ${ollamaOnline ? 'active' : 'idle'}`} />
              <span className="holo-title">Mochi AI</span>
              <span className="holo-model-pill">
                {ollamaModel ? `ollama • ${ollamaModel}` : 'local ollama'}
              </span>
            </div>
            <button
              className="holo-close-btn"
              onClick={() => setShowQuickChat(false)}
              title="Close chat (Esc)"
            >
              <X size={13} />
            </button>
          </div>

          {/* Conversation Feed */}
          <div className="holo-console-feed" ref={chatFeedRef}>
            {quickChatHistory.length === 0 ? (
              <div className="holo-empty-state">
                <Sparkles size={16} className="holo-sparkle-icon" />
                <p className="holo-welcome-text">
                  Direct Desktop AI with Local Ollama
                </p>
                <span className="holo-sub-hint">
                  Ask questions, debug code, or chat while watching the Matrix Orb react in real-time.
                </span>
              </div>
            ) : (
              quickChatHistory.map((msg, idx) => (
                <div key={idx} className={`holo-msg-row ${msg.sender}`}>
                  <div className="holo-msg-bubble">
                    <span className="holo-msg-text">{msg.text}</span>
                  </div>
                </div>
              ))
            )}
            {isChatThinking && (
              <div className="holo-thinking-row">
                <div className="holo-thinking-bars">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="holo-thinking-label">
                  Reasoning with {ollamaModel || 'Ollama'}...
                </span>
              </div>
            )}
          </div>

          {/* Futuristic Input Form */}
          <form className="holo-input-form" onSubmit={handleSendQuickChat}>
            <input
              ref={quickChatInputRef}
              type="text"
              className="holo-chat-input"
              placeholder={isChatThinking ? "Mochi is reasoning..." : "Ask or talk to Mochi... (Enter to send)"}
              value={quickChatInput}
              onChange={handleQuickChatInputChange}
              disabled={isChatThinking}
              maxLength={500}
            />
            <button
              type="submit"
              className="holo-send-btn"
              disabled={!quickChatInput.trim() || isChatThinking}
              title="Send Message"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}

      {/* Dynamic Island Pill Mode */}
      {isDynamicIsland ? (
        <div
          ref={islandRef}
          className={`mochi-dynamic-island-pill ${isEntering ? 'apple-entrance' : ''} ${isExiting ? 'apple-exit' : ''}`}
          onClick={handlePetAction}
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleToggleIsland();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenuPos({ x: e.clientX, y: e.clientY });
          }}
          title="Dynamic Island Mode (Click to open, double-click to expand, drag to move)"
        >
          <div className="island-orb-preview">
            <IslandFluidOrb
              state={currentState}
              isSpeaking={isSpeaking}
              size={28}
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
                <span className="island-desc">
                  {reactionMessage ? (reactionMessage.subtitle || reactionMessage.title) : 'Ready to build ✨'}
                </span>
              </div>
            )}
          </div>
          <div className="island-right-actions">
            <button
              className="island-chat-icon-btn"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setIsDynamicIsland(false);
                setShowQuickChat(true);
              }}
              title="Chat with Mochi (Local Ollama AI)"
            >
              <MessageSquare size={12} />
            </button>
            <button
              className="island-expand-icon-btn"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleIsland();
              }}
              title="Expand to Mascot Orb"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`mochi-pet-stage ${isEntering ? 'apple-entrance' : ''} ${isExpanding ? 'orb-expanding' : ''} ${isExiting ? 'apple-exit' : ''}`}
          style={{
            width: petSize,
            height: petSize,
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenuPos({ x: e.clientX, y: e.clientY });
          }}
        >
          {/* Cyber Floating Chat Trigger (Positioned outside the orb boundary - NEVER covers eyes or face) */}
          {!showQuickChat && (
            <button
              className="orb-cyber-chat-trigger"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickChat(true);
              }}
              title="Pull up AI Chat with Mochi (Local Ollama)"
            >
              <MessageSquare size={12} />
              <span>Chat</span>
            </button>
          )}
          {/* Apple Startup Bloom Ring */}
          {isEntering && <div className="apple-start-bloom-ring" />}

          {/* Glowing Green Status Dot at top-right rim (matching photo!) */}
          <div className="orb-status-indicator" data-state={currentState} title="Assistant Status" />

          {/* Floating Capsule / Speech Bubble / Onboarding Anchor - directly hugs top of orb */}
          {!showQuickChat && (
            <div
              className="mochi-bubble-anchor"
              style={{
                transform: `scale(${bubbleScale})`,
                transformOrigin: 'bottom right',
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
                  {/* Cloud scallops along top to match the photo */}
                  <div className="cloud-scallop-1" />
                  <div className="cloud-scallop-2" />

                  {/* Connector thought bubble dot pointing down to the orb */}
                  <div className="bubble-connector-dot" />

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
          )}

          {/* Floating Love Heart Wave from petting */}
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
            title="Mochi Companion (Click to open, double-click for pill mode, right-click for menu, drag to move)"
          >
            {showQuickChat ? (
              <MatrixOrb
                state={matrixState}
                level={typingLevel}
                size={petSize}
                color="#00f7ff"
                dots={13}
              />
            ) : orbMode === 'glow-lava' ? (
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

      {/* Apple-Style Glass Context Menu on Right-Click */}
      {contextMenuPos && (
        <div
          className="mochi-apple-context-menu"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="context-menu-item"
            onClick={() => {
              setContextMenuPos(null);
              window.mochiApi?.toggleAssistant();
            }}
          >
            <Sparkles size={13} />
            <span>Open Assistant</span>
          </button>
          <button
            className="context-menu-item"
            onClick={() => {
              setContextMenuPos(null);
              setShowQuickChat(true);
              setTimeout(() => quickChatInputRef.current?.focus(), 80);
            }}
          >
            <MessageSquare size={13} />
            <span>Chat with Mochi (Local AI)</span>
          </button>
          <button
            className="context-menu-item"
            onClick={() => {
              setContextMenuPos(null);
              handleToggleIsland();
            }}
          >
            {isDynamicIsland ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            <span>{isDynamicIsland ? 'Expand to Mascot' : 'Snap to Pill Mode'}</span>
          </button>
          <button
            className="context-menu-item"
            onClick={async () => {
              setContextMenuPos(null);
              if (window.mochiApi) {
                await window.mochiApi.setPetVisible(false);
                const plat = await window.mochiApi.getPlatform?.();
                const locationHint = plat === 'darwin' ? 'menu bar at top' : 'taskbar notification tray';
                window.mochiApi.showNotification(
                  'Deep Work Mode Active 🧘',
                  `Mochi is resting. Click the Mochi icon in your ${locationHint} to wake anytime!`
                );
              }
            }}
          >
            <EyeOff size={13} />
            <span>Rest Mochi (Hide)</span>
          </button>
          <div className="context-menu-divider" />
          <button
            className="context-menu-item danger"
            onClick={() => {
              setContextMenuPos(null);
              handleGracefulQuit();
            }}
          >
            <Power size={13} />
            <span>Turn Off Mochi</span>
          </button>
        </div>
      )}
    </div>
  );
};
