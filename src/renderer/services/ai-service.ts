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

    // 2. If an external AI provider is configured and IPC bridge is available
    if (settings.provider === 'openai') {
      try {
        if (window.mochiApi?.queryAi) {
          const aiResult = await window.mochiApi.queryAi(userText, history);
          if (aiResult.text) {
            return {
              text: aiResult.text,
              isExternalAi: true,
            };
          }
        }
      } catch (err) {
        console.warn('[AiService] Main process AI proxy request failed, falling back to local heuristic:', err);
      }
    }

    // 3. Intelligent Local Offline Companion Engine
    return this.generateOfflineResponse(userText);
  }

  private static generateOfflineResponse(prompt: string): AiResponse {
    // Word-boundary regexes to prevent false triggers (e.g., 'this' triggering 'hi')
    if (/\b(hello|hi|hey|howdy|greetings|aloha)\b/i.test(prompt)) {
      const greetings = [
        'Hello there! I am floating right here beside you. How is your focus today?',
        'Hi! Mochi is awake and ready. Want to start a focus session or organize your to-do list?',
        'Greetings! My glowing core is warmed up. What are we tackling together?',
      ];
      return {
        text: greetings[Math.floor(Math.random() * greetings.length)],
        suggestedAction: {
          type: 'start_timer',
          label: 'Start 25m Focus Session',
          payload: { seconds: 1500, label: 'Focus Session' },
        },
      };
    }

    if (/\b(how are you|how do you feel|how's it going|how are things)\b/i.test(prompt)) {
      return {
        text: 'I feel radiant and ready! My particles are swirling smoothly. How is your energy level right now?',
      };
    }

    if (/\b(tired|exhausted|sleepy|fatigued|drained|burnout)\b/i.test(prompt)) {
      return {
        text: 'You have been working hard! Remember that resting is part of high performance. Would you like a 5-minute break with calming breathing?',
        suggestedAction: {
          type: 'start_timer',
          label: 'Start 5m Relaxing Break',
          payload: { seconds: 300, label: 'Mindful Rest' },
        },
      };
    }

    if (/\b(stress|stressed|anxious|anxiety|overwhelmed|panic)\b/i.test(prompt)) {
      return {
        text: 'Take a deep breath with me. Inhale for 4 seconds... exhale slowly for 4 seconds. Let us pick just ONE small task to start with.',
      };
    }

    if (/\b(water|thirsty|drink|hydrate|hydration)\b/i.test(prompt)) {
      return {
        text: 'Staying hydrated keeps your brain sharp! Grab a tall glass of water now. 💧',
        suggestedAction: {
          type: 'set_water_reminder',
          label: 'Set 30m Water Reminder',
          payload: { intervalMinutes: 30 },
        },
      };
    }

    if (/\b(joke|jokes|funny|make me laugh)\b/i.test(prompt)) {
      const jokes = [
        'Why do programmers prefer dark mode? Because light attracts bugs! 💡',
        'Why was the JavaScript developer sad? Because they didn’t Node how to Express themselves!',
        'There are 10 types of people in the world: those who understand binary, and those who do not.',
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

    // General fallback offline response
    return {
      text: `I hear you! I am running in offline local mode. You can ask me to set timers, manage tasks, take breaks, or switch into focus mode anytime.`,
      suggestedAction: {
        type: 'start_timer',
        label: 'Start 20m Focus Timer',
        payload: { seconds: 1200, label: 'Focus Timer' },
      },
    };
  }
}
