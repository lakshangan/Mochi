import { AiSettings, ChatMessage, ChatSuggestedAction } from '../../shared/types';
import { parseLocalCommand } from '../../shared/command-parser';

export interface AiResponse {
  text: string;
  suggestedAction?: ChatSuggestedAction;
  isExternalAi?: boolean;
}

export class AiCompanionService {
  public static async generateResponse(
    userText: string,
    history: ChatMessage[],
    settings: AiSettings
  ): Promise<AiResponse> {
    // 1. First check deterministic local commands
    const parsed = parseLocalCommand(userText);
    if (parsed.action !== 'unknown' && parsed.action !== 'help') {
      let suggestedAction: ChatSuggestedAction | undefined;

      switch (parsed.action) {
        case 'timer_start':
          suggestedAction = {
            type: 'start_timer',
            label: `Timer: ${Math.round(parsed.payload.seconds / 60)}m`,
            payload: parsed.payload,
            autoExecuted: true,
          };
          break;
        case 'pomodoro_start':
          suggestedAction = {
            type: 'start_pomodoro',
            label: `Pomodoro (${parsed.payload.phase})`,
            payload: parsed.payload,
            autoExecuted: true,
          };
          break;
        case 'timer_pause':
          suggestedAction = {
            type: 'pause_timer',
            label: 'Pause Timer',
            payload: parsed.payload,
            autoExecuted: true,
          };
          break;
        case 'timer_resume':
          suggestedAction = {
            type: 'resume_timer',
            label: 'Resume Timer',
            payload: parsed.payload,
            autoExecuted: true,
          };
          break;
        case 'timer_reset':
          suggestedAction = {
            type: 'reset_timer',
            label: 'Reset Timer',
            payload: parsed.payload,
            autoExecuted: true,
          };
          break;
        case 'water_reminder_set':
          suggestedAction = {
            type: 'set_water_reminder',
            label: `Hydration: ${parsed.payload.intervalMinutes}m`,
            payload: parsed.payload,
            autoExecuted: true,
          };
          break;
        case 'break_reminder_set':
          suggestedAction = {
            type: 'set_break_reminder',
            label: `Break: ${parsed.payload.intervalMinutes}m`,
            payload: parsed.payload,
            autoExecuted: true,
          };
          break;
        case 'task_add':
          suggestedAction = {
            type: 'create_task',
            label: `Task: ${parsed.payload.title}`,
            payload: parsed.payload,
            autoExecuted: true,
          };
          break;
        case 'task_list':
          suggestedAction = {
            type: 'view_tab',
            label: 'Open Tasks List →',
            payload: { tab: 'tasks' },
            autoExecuted: false,
          };
          break;
        case 'task_clear_completed':
          suggestedAction = {
            type: 'clear_completed_tasks',
            label: 'Clear Completed',
            payload: parsed.payload,
            autoExecuted: true,
          };
          break;
        case 'note_add':
          suggestedAction = {
            type: 'add_note',
            label: `Save Note`,
            payload: parsed.payload,
            autoExecuted: true,
          };
          break;
        case 'pet_state':
          suggestedAction = {
            type: 'pet_mood',
            label: `Mood: ${parsed.payload.state}`,
            payload: parsed.payload,
            autoExecuted: true,
          };
          break;
      }

      return {
        text: parsed.feedback,
        suggestedAction,
      };
    }

    // 2. Query Local Ollama or Cloud AI Provider via Main Process Proxy
    if (settings.provider === 'ollama' || settings.provider === 'openai' || !settings.provider) {
      try {
        if (window.mochiApi?.queryAi) {
          const aiResult = await window.mochiApi.queryAi(userText, history);
          if (aiResult?.text) {
            return {
              text: aiResult.text,
              isExternalAi: true,
            };
          }
          if (aiResult?.error && settings.provider === 'ollama') {
            return {
              text: `Local Ollama status: ${aiResult.error} Falling back to offline companion mode for now! ✨`,
              suggestedAction: {
                type: 'view_tab',
                label: 'Check Ollama Settings →',
                payload: { tab: 'settings' },
              },
            };
          }
        }
      } catch (err) {
        console.warn('[AiService] Main process AI proxy request failed, falling back to local heuristic:', err);
      }
    }

    // 3. Intelligent Local Offline Companion Engine
    return this.generateOfflineResponse(userText, history);
  }

  private static generateOfflineResponse(prompt: string, history: ChatMessage[] = []): AiResponse {
    const clean = prompt.trim();
    const lower = clean.toLowerCase();

    // 1. Wake up / Opening Assistant
    if (/\b(wake up|wake|are you awake|waking up|rise and shine|good morning mochi)\b/i.test(lower)) {
      return {
        text: 'Waking up the assistant... 💤 I am right here with you and fully powered up! What can we conquer together today? ✨',
        suggestedAction: {
          type: 'start_timer',
          label: 'Start 25m Focus Session',
          payload: { seconds: 1500, label: 'Deep Focus' },
        },
      };
    }

    // 2. Greetings & Time-of-Day
    if (/\b(good morning|morning)\b/i.test(lower)) {
      return {
        text: 'Good morning! ☀️ Wishing you a calm, clear-headed, and productive day. What is the one key goal you want to knock out first?',
        suggestedAction: {
          type: 'start_timer',
          label: 'Start 25m Morning Sprint',
          payload: { seconds: 1500, label: 'Morning Sprint' },
        },
      };
    }

    if (/\b(good evening|evening)\b/i.test(lower)) {
      return {
        text: 'Good evening! 🌆 How was your day? Remember to wrap up open loops soon so your mind can truly unwind tonight.',
      };
    }

    if (/\b(good night|goodnight|going to sleep|bedtime|sleep well)\b/i.test(lower)) {
      return {
        text: 'Rest well! 🌙 You worked hard today. Turn off notifications, relax your shoulders, and recharge your batteries.',
        suggestedAction: {
          type: 'pet_mood',
          label: 'Sleep Mode',
          payload: { state: 'sleeping' },
        },
      };
    }

    if (/\b(hello|hi|hey|howdy|greetings|aloha|sup|yo|hiya)\b/i.test(lower)) {
      const greetings = [
        'Hey there! Wonderful to see you. How is your focus feeling today? ✨',
        'Hello! Mochi is awake and floating right beside you. Ready to get in the zone?',
        'Hey! I was just keeping your desk warm. What are we working on right now?',
        'Hi there! All systems glowing. Need a timer, a task logged, or just some good company? 😊',
      ];
      return {
        text: greetings[Math.floor(Math.random() * greetings.length)],
        suggestedAction: {
          type: 'start_timer',
          label: 'Start 25m Focus Timer',
          payload: { seconds: 1500, label: 'Focus Session' },
        },
      };
    }

    // 3. How are you / Status
    if (/\b(how are you|how do you feel|how's it going|how are things|what's up|whats up|how you doing)\b/i.test(lower)) {
      const statuses = [
        'I feel radiant and ready! My little glowing core is humming along nicely. How is your energy level right now?',
        'Doing great! Floating steady, watching your progress. Are you having a smooth flow day?',
        'All green on my end! 🌟 More importantly, how are YOU holding up with your tasks today?',
      ];
      return {
        text: statuses[Math.floor(Math.random() * statuses.length)],
      };
    }

    // 4. Who are you / Identity
    if (/\b(who are you|what are you|tell me about yourself|what do you do|your name)\b/i.test(lower)) {
      return {
        text: 'I am Mochi! 🍡 Your living desktop companion. I float in your corner to protect your focus, celebrate your milestones, track timers and tasks, and make desk work feel a lot friendlier.',
      };
    }

    // 5. Stress, Anxiety & Overwhelm
    if (/\b(stress|stressed|anxious|anxiety|overwhelmed|overwhelming|panic|freaking out|too much to do)\b/i.test(lower)) {
      return {
        text: 'Take a slow, deep breath with me. Inhale for 4 seconds... hold for 4... exhale slowly for 4. 🌿 You don’t need to tackle the entire mountain today; just pick ONE single tiny step. What is the easiest thing to do first?',
        suggestedAction: {
          type: 'start_timer',
          label: 'Start 5m Breathing Break',
          payload: { seconds: 300, label: 'Calm & Breathe' },
        },
      };
    }

    // 6. Tiredness, Burnout & Low Energy
    if (/\b(tired|exhausted|sleepy|fatigued|drained|burnout|burned out|no energy|lethargic)\b/i.test(lower)) {
      return {
        text: 'Listen to your body! Resting is not a reward for work—it is an essential requirement. Can you step away for 5 minutes, stretch your neck, and grab a cold glass of water?',
        suggestedAction: {
          type: 'start_timer',
          label: 'Take 5m Rest Break',
          payload: { seconds: 300, label: 'Rest Break' },
        },
      };
    }

    // 7. Procrastination & Trouble Starting
    if (/\b(procrastinat|can't focus|cant focus|hard to focus|unmotivated|no motivation|lazy|distracted|stuck)\b/i.test(lower)) {
      return {
        text: 'Starting is 90% of the battle! Try the 2-Minute Rule: commit to working on the task for just two minutes. If you still want to quit after that, you can. Want me to start a quick 10-minute sprint to get you moving?',
        suggestedAction: {
          type: 'start_timer',
          label: 'Start 10m Starter Sprint',
          payload: { seconds: 600, label: 'Starter Sprint' },
        },
      };
    }

    // 8. Wins, Achievements & Celebration
    if (/\b(i did it|finished|completed|solved it|finally done|crushed it|shipped|passed|hurray|yay)\b/i.test(lower)) {
      return {
        text: 'LET’S GOOO! 🎉 High five! That is huge progress. Soak in that feeling of accomplishment—you earned it!',
        suggestedAction: {
          type: 'pet_mood',
          label: 'Celebrate with Mochi! 🕶️',
          payload: { state: 'party' },
        },
      };
    }

    // 9. Bad day, Sadness & Venting
    if (/\b(bad day|sad|depressed|feeling down|unhappy|crying|upset|everything sucks|terrible day)\b/i.test(lower)) {
      return {
        text: 'I am really sorry today has been heavy. Please be gentle with yourself. Rough days happen, but they pass. I am right here in your corner whenever you need quiet company. 🌿',
        suggestedAction: {
          type: 'pet_mood',
          label: 'Comfort Mochi',
          payload: { state: 'smile' },
        },
      };
    }

    // 10. Hydration & Water
    if (/\b(water|thirsty|drink|hydrate|hydration|sip)\b/i.test(lower)) {
      return {
        text: 'Hydration is your brain’s secret superpower! 💧 Even a 2% drop in hydration cuts concentration and mood. Go grab a fresh glass right now!',
        suggestedAction: {
          type: 'set_water_reminder',
          label: 'Remind Me Every 30m',
          payload: { intervalMinutes: 30 },
        },
      };
    }

    // 11. Posture & Physical Wellness
    if (/\b(posture|back hurts|neck hurts|ergonomics|stretch|stretching|shoulder)\b/i.test(lower)) {
      return {
        text: 'Quick ergonomic check! 🧘 Unclench your jaw, drop your shoulders away from your ears, and lengthen your spine. Take a slow roll of your shoulders backwards. Much better!',
      };
    }

    // 12. Productivity Tips & Advice
    if (/\b(productivity tip|productivity advice|study tip|how to study|how to work better|give me advice|tips)\b/i.test(lower)) {
      const tips = [
        'Tip: Practice "Monotasking". Close your background browser tabs and silence notifications for just 25 minutes. Singletasking produces 3x better results than multitasking!',
        'Tip: The "Eat the Frog" method. Tackle your most dreaded or high-impact task first thing in the morning when willpower is highest.',
        'Tip: The 20-20-20 Rule. Every 20 minutes, look at an object 20 feet away for 20 seconds to prevent optical fatigue and headaches.',
        'Tip: Set an artificial finish line. When you decide "I am closing my laptop at 6 PM sharp", you automatically eliminate low-value busywork.',
      ];
      return {
        text: tips[Math.floor(Math.random() * tips.length)],
        suggestedAction: {
          type: 'start_pomodoro',
          label: 'Start 25m Pomodoro',
          payload: { phase: 'focus' },
        },
      };
    }

    // 13. Coding & Developer Banter
    if (/\b(code|coding|programming|bug|bugs|debug|debugging|javascript|typescript|python|react|git)\b/i.test(lower)) {
      const devResponses = [
        'Debugging wisdom: When code doesn’t work, take a 3-minute walk and drink water. 9 times out of 10, the answer hits you as soon as you step away from the keyboard! 🐛✨',
        'Clean code is like clear writing—keep functions small, naming obvious, and remember that code is read 10x more often than it is written! </>',
        'Working through a tough bug? Explain it to me line-by-line! The good old "rubber duck" technique works wonders. 🦆',
      ];
      return {
        text: devResponses[Math.floor(Math.random() * devResponses.length)],
        suggestedAction: {
          type: 'pet_mood',
          label: 'Code Flow Mode',
          payload: { state: 'coding' },
        },
      };
    }

    // 14. Jokes & Fun
    if (/\b(joke|jokes|funny|make me laugh|tell a joke|humor)\b/i.test(lower)) {
      const jokes = [
        'Why do programmers prefer dark mode? Because light attracts bugs! 💡',
        'Why was the JavaScript developer sad? Because they didn’t Node how to Express themselves! 😄',
        'There are 10 types of people in the world: those who understand binary, and those who do not.',
        'Why did the developer go broke? Because they used up all their cache! 💰',
        'A SQL query walks into a bar, walks up to two tables and asks: "Can I join you?" 🍻',
      ];
      return {
        text: jokes[Math.floor(Math.random() * jokes.length)],
        suggestedAction: {
          type: 'pet_mood',
          label: 'Make Mochi Happy',
          payload: { state: 'happy' },
        },
      };
    }

    // 15. Affection, Compliments & Gratitude
    if (/\b(thank you|thanks|thx|appreciate it|grateful)\b/i.test(lower)) {
      return {
        text: 'You are so welcome! 😊 Always happy to float by your side. Let me know whenever you need anything else.',
      };
    }

    if (/\b(love you|cute|good mochi|good pet|best pet|awesome|you rock|good job)\b/i.test(lower)) {
      return {
        text: 'Aww, thank you! 🥰 That makes my little core glow extra bright. You are pretty awesome yourself!',
        suggestedAction: {
          type: 'pet_mood',
          label: 'Happy Mochi',
          payload: { state: 'happy' },
        },
      };
    }

    // 16. What is the meaning of life / Philosophy
    if (/\b(meaning of life|philosophy|why are we here|existential)\b/i.test(lower)) {
      return {
        text: 'From a desktop companion’s view? Stay curious, be kind to yourself and others, hydrate often, and build things that bring a little light into the world. ✨',
      };
    }

    // 17. Thoughtful Natural Fallback
    const fallbacks = [
      `I hear you! I am floating right here beside you. Would you like to kick off a focused work block, jot down a quick note, or take a breather?`,
      `That sounds interesting! My offline companion brain is listening. We can time your session, log tasks, or celebrate your progress anytime.`,
      `Got it! Let’s keep your momentum smooth today. What would help you most right now: a focus timer, a water check, or diving into tasks?`,
    ];

    return {
      text: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      suggestedAction: {
        type: 'start_timer',
        label: 'Start 20m Focus Timer',
        payload: { seconds: 1200, label: 'Focus Timer' },
      },
    };
  }
}
