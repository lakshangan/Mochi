import { AiSettings, ChatMessage } from '../../shared/types';
import { parseLocalCommand } from '../../shared/command-parser';

export interface AiResponse {
  text: string;
  suggestedAction?: {
    type: 'start_timer' | 'create_task' | 'add_note' | 'pet_mood';
    label: string;
    payload: any;
  };
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
      let suggestedAction: AiResponse['suggestedAction'];
      if (parsed.action === 'timer_start') {
        suggestedAction = {
          type: 'start_timer',
          label: `Start ${parsed.payload.seconds / 60}m Timer`,
          payload: parsed.payload,
        };
      } else if (parsed.action === 'task_add') {
        suggestedAction = {
          type: 'create_task',
          label: `Add Task: ${parsed.payload.title}`,
          payload: parsed.payload,
        };
      } else if (parsed.action === 'note_add') {
        suggestedAction = {
          type: 'add_note',
          label: `Save Note`,
          payload: parsed.payload,
        };
      }

      return {
        text: parsed.feedback,
        suggestedAction,
      };
    }

    // 2. If an external AI provider is configured and key is present
    if (settings.provider === 'openai' && settings.apiKey) {
      try {
        const endpoint = settings.apiEndpoint || 'https://api.openai.com/v1/chat/completions';
        const model = settings.model || 'gpt-4o-mini';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'You are Mochi, a friendly, calm, intelligent, and glowing digital orb companion on the desktop. Keep responses concise, uplifting, and productivity-focused (under 3 sentences). Offer helpful advice for study, breaks, hydration, and tasks.',
              },
              ...history.slice(-4).map((m) => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text,
              })),
              { role: 'user', content: userText },
            ],
            temperature: settings.temperature ?? 0.7,
            max_tokens: 150,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) {
            return { text: content };
          }
        }
      } catch (err) {
        console.warn('[AiService] External provider request failed, falling back to local:', err);
      }
    }

    // 3. Intelligent Local Offline Companion Engine
    return this.generateOfflineResponse(userText);
  }

  private static generateOfflineResponse(prompt: string): AiResponse {
    const lower = prompt.toLowerCase();

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
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

    if (lower.includes('how are you') || lower.includes('how do you feel')) {
      return {
        text: 'I feel radiant and ready! My particles are swirling smoothly. How is your energy level right now?',
      };
    }

    if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('sleepy')) {
      return {
        text: 'You have been working hard! Remember that resting is part of high performance. Would you like a 5-minute break with calming breathing?',
        suggestedAction: {
          type: 'start_timer',
          label: 'Start 5m Relaxing Break',
          payload: { seconds: 300, label: 'Mindful Rest' },
        },
      };
    }

    if (lower.includes('stress') || lower.includes('anxious') || lower.includes('overwhelmed')) {
      return {
        text: 'Take a deep breath with me. Inhale for 4 seconds... exhale slowly for 4 seconds. Let us pick just ONE small task to start with.',
      };
    }

    if (lower.includes('water') || lower.includes('thirsty') || lower.includes('drink')) {
      return {
        text: 'Staying hydrated keeps your brain sharp! Grab a tall glass of water now. 💧',
      };
    }

    if (lower.includes('joke') || lower.includes('make me laugh')) {
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
