import { ParsedCommandResult } from './types';

/**
 * Extracts duration in seconds from strings like:
 * "10 minutes", "25m", "1 hour 15 minutes", "45 secs", "90s", "1.5 hours", "10 min"
 */
export function parseDurationToSeconds(input: string): number | null {
  const normalized = input.toLowerCase().trim();
  let totalSeconds = 0;
  let matched = false;

  // Patterns for hours, minutes, seconds
  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
  if (hourMatch) {
    totalSeconds += Math.round(parseFloat(hourMatch[1]) * 3600);
    matched = true;
  }

  const minMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)\b/);
  if (minMatch) {
    totalSeconds += Math.round(parseFloat(minMatch[1]) * 60);
    matched = true;
  }

  const secMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/);
  if (secMatch) {
    totalSeconds += Math.round(parseFloat(secMatch[1]));
    matched = true;
  }

  // Bare numbers like "timer 10" -> default to minutes if small or reasonable
  if (!matched) {
    const bareMatch = normalized.match(/\b(\d+)\b/);
    if (bareMatch) {
      const val = parseInt(bareMatch[1], 10);
      if (val > 0 && val <= 360) {
        totalSeconds = val * 60; // assume minutes
        matched = true;
      }
    }
  }

  return matched && totalSeconds > 0 ? totalSeconds : null;
}

/**
 * Parses user natural language commands locally and deterministically.
 */
export function parseLocalCommand(rawInput: string): ParsedCommandResult {
  const text = rawInput.trim();
  const lower = text.toLowerCase();

  if (!text) {
    return {
      action: 'unknown',
      feedback: 'Please enter a command or prompt.',
      confidence: 0,
    };
  }

  // Help command
  if (
    lower === 'help' ||
    lower === 'commands' ||
    lower.includes('what can you do') ||
    lower.includes('help me')
  ) {
    return {
      action: 'help',
      feedback:
        'Try commands like:\n• "Start a 15-minute timer"\n• "Start Pomodoro session"\n• "Remind me to drink water in 30 minutes"\n• "Add a task to finish the project"\n• "Show tasks"\n• "Add note: Meeting at 3pm"\n• "Make Mochi happy" or "Sleep"',
      confidence: 1.0,
    };
  }

  // Pomodoro commands
  if (
    lower.includes('pomodoro') ||
    lower.includes('focus session') ||
    lower.includes('study session') ||
    lower.includes('work session')
  ) {
    if (lower.includes('break') || lower.includes('short break')) {
      return {
        action: 'pomodoro_start',
        payload: { phase: 'short-break' },
        feedback: 'Starting a 5-minute Pomodoro short break. Time to stretch!',
        confidence: 0.95,
      };
    }
    return {
      action: 'pomodoro_start',
      payload: { phase: 'focus' },
      feedback: 'Starting a 25-minute Pomodoro focus session. Let’s do this!',
      confidence: 0.95,
    };
  }

  // Timer controls (Pause, Resume, Reset, Stop)
  if (
    lower === 'pause timer' ||
    lower === 'pause the timer' ||
    lower === 'pause' ||
    lower.startsWith('pause')
  ) {
    return {
      action: 'timer_pause',
      feedback: 'Timer paused.',
      confidence: 0.9,
    };
  }

  if (
    lower === 'resume timer' ||
    lower === 'resume the timer' ||
    lower === 'unpause timer' ||
    lower === 'continue timer' ||
    lower === 'resume'
  ) {
    return {
      action: 'timer_resume',
      feedback: 'Timer resumed.',
      confidence: 0.9,
    };
  }

  if (
    lower === 'reset timer' ||
    lower === 'stop timer' ||
    lower === 'cancel timer' ||
    lower === 'clear timer'
  ) {
    return {
      action: 'timer_reset',
      feedback: 'Timer has been reset.',
      confidence: 0.95,
    };
  }

  // Hydration / Drink Log action
  if (
    lower === 'drink log' ||
    lower === 'log drink' ||
    lower === 'log water' ||
    lower === 'water log' ||
    lower === 'drank water' ||
    lower === 'drink water' ||
    lower === 'i drank water' ||
    lower === 'water drop' ||
    lower === 'hydrated' ||
    lower === 'drank' ||
    lower.startsWith('log drink') ||
    lower.startsWith('logged water') ||
    lower.startsWith('i drank')
  ) {
    return {
      action: 'pet_state',
      payload: { state: 'hydrated' },
      feedback: 'Logged hydration! 💧💖 Mochi is glowing with refreshing energy.',
      confidence: 0.98,
    };
  }

  // Water Reminder commands
  if (lower.includes('water') || lower.includes('hydrate') || lower.includes('drink')) {
    const duration = parseDurationToSeconds(lower);
    const minutes = duration ? Math.max(1, Math.round(duration / 60)) : 30;
    return {
      action: 'water_reminder_set',
      payload: { intervalMinutes: minutes },
      feedback: `Hydration reminder set for every ${minutes} minute${minutes === 1 ? '' : 's'}. Stay hydrated!`,
      confidence: 0.9,
    };
  }

  // Break Reminder commands
  if (
    lower.includes('break reminder') ||
    lower.includes('remind me to break') ||
    lower.includes('take a break')
  ) {
    const duration = parseDurationToSeconds(lower);
    const minutes = duration ? Math.max(1, Math.round(duration / 60)) : 50;
    return {
      action: 'break_reminder_set',
      payload: { intervalMinutes: minutes },
      feedback: `Break reminder set for every ${minutes} minutes. Your eyes and back will thank you!`,
      confidence: 0.9,
    };
  }

  // Start Timer command
  if (
    lower.includes('timer') ||
    lower.startsWith('set timer') ||
    lower.startsWith('start timer') ||
    lower.startsWith('countdown')
  ) {
    const seconds = parseDurationToSeconds(lower);
    if (seconds && seconds > 0) {
      // Extract label if present (e.g., "for tea", "for meeting")
      let label = 'Timer';
      const forMatch = text.match(/\bfor\s+([a-zA-Z0-9\s_-]+)$/i);
      if (forMatch && !forMatch[1].match(/^\d+\s*(?:min|sec|hour)/i)) {
        label = forMatch[1].trim();
      }

      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      const durationStr =
        mins > 0 ? `${mins}m ${secs > 0 ? `${secs}s` : ''}`.trim() : `${secs}s`;

      return {
        action: 'timer_start',
        payload: { seconds, label },
        feedback: `Started countdown timer for ${durationStr}${label !== 'Timer' ? ` (${label})` : ''}.`,
        confidence: 0.95,
      };
    } else {
      return {
        action: 'unknown',
        feedback: 'Could not determine timer duration. Example: "Start a 10-minute timer".',
        confidence: 0.4,
      };
    }
  }

  // Task creation
  if (
    lower.startsWith('add task') ||
    lower.startsWith('task:') ||
    lower.startsWith('task ') ||
    lower.startsWith('todo ') ||
    lower.startsWith('new task') ||
    lower.startsWith('create task')
  ) {
    let taskText = text
      .replace(/^(?:add\s+task\s+(?:to\s+)?|task:\s*|task\s+|todo\s+|new\s+task\s+|create\s+task\s+)/i, '')
      .trim();

    if (taskText) {
      return {
        action: 'task_add',
        payload: { title: taskText, priority: 'medium' },
        feedback: `Added task: "${taskText}".`,
        confidence: 0.95,
      };
    }
  }

  // Task listing
  if (
    lower === 'show tasks' ||
    lower === 'list tasks' ||
    lower === 'show pending tasks' ||
    lower === 'my tasks' ||
    lower === 'tasks'
  ) {
    return {
      action: 'task_list',
      feedback: 'Displaying your tasks list.',
      confidence: 0.95,
    };
  }

  if (lower.includes('clear completed') || lower.includes('clean tasks')) {
    return {
      action: 'task_clear_completed',
      feedback: 'Cleared all completed tasks.',
      confidence: 0.9,
    };
  }

  // Notes creation
  if (
    lower.startsWith('add note') ||
    lower.startsWith('note:') ||
    lower.startsWith('note ') ||
    lower.startsWith('new note') ||
    lower.startsWith('quick note')
  ) {
    let noteContent = text
      .replace(/^(?:add\s+note(?:\s*:\s*|\s+)?|note:\s*|note\s+|new\s+note\s+|quick\s+note\s+)/i, '')
      .trim();

    if (noteContent) {
      return {
        action: 'note_add',
        payload: {
          title: noteContent.slice(0, 30) + (noteContent.length > 30 ? '...' : ''),
          content: noteContent,
        },
        feedback: `Note saved: "${noteContent.slice(0, 40)}${noteContent.length > 40 ? '...' : ''}"`,
        confidence: 0.95,
      };
    }
  }

  // Emoticons & Face Expressions
  if (
    lower === ':)' ||
    lower === ':-)' ||
    lower === '=)' ||
    lower.includes(':)') ||
    lower.includes(':-)')
  ) {
    return {
      action: 'pet_state',
      payload: { state: 'smile' },
      feedback: 'Mochi returns your cheerful smile! :) ✨',
      confidence: 0.95,
    };
  }

  if (
    lower === ':(' ||
    lower === ':-(' ||
    lower === '=(' ||
    lower.includes(':(') ||
    lower.includes(':-(') ||
    lower === 'sad' ||
    lower === 'pout' ||
    lower.includes('unhappy')
  ) {
    return {
      action: 'pet_state',
      payload: { state: 'sad' },
      feedback: 'Mochi shares a sympathetic pout :(. Take a deep breath! 🫂',
      confidence: 0.95,
    };
  }

  if (lower === 'smile') {
    return {
      action: 'pet_state',
      payload: { state: 'smile' },
      feedback: 'Mochi smiles warmly at you! :) ✨',
      confidence: 0.95,
    };
  }

  // Fire Flow State 🔥
  if (
    lower === 'fire' ||
    lower === 'on fire' ||
    lower.includes('fire') ||
    lower.includes('streak') ||
    lower.includes('blaze')
  ) {
    return {
      action: 'pet_state',
      payload: { state: 'fire' },
      feedback: 'Mochi ignites into blazing fire mode! 🔥 Keep up the momentum!',
      confidence: 0.95,
    };
  }

  // Coding Tag Mode </>
  if (
    lower === 'coding' ||
    lower === 'code' ||
    lower === '</>' ||
    lower === '<\\>' ||
    lower.includes('code mode')
  ) {
    return {
      action: 'pet_state',
      payload: { state: 'coding' },
      feedback: 'Mochi activates code brackets </> mode! Laser-focused on shipping.',
      confidence: 0.95,
    };
  }

  // Pet emotion / animation state trigger
  if (lower.includes('happy') || lower.includes('cheer')) {
    return {
      action: 'pet_state',
      payload: { state: 'happy' },
      feedback: 'Mochi is smiling happily at you! ✨',
      confidence: 0.9,
    };
  }
  if (lower.includes('sleep') || lower.includes('nap') || lower.includes('goodnight')) {
    return {
      action: 'pet_state',
      payload: { state: 'sleeping' },
      feedback: 'Mochi gently drifts off to sleep... 💤',
      confidence: 0.9,
    };
  }
  if (lower.includes('wake up') || lower.includes('wake') || lower.includes('good morning')) {
    return {
      action: 'pet_state',
      payload: { state: 'waking' },
      feedback: 'Mochi opens its glowing eyes and yawns awake! 🌅',
      confidence: 0.9,
    };
  }
  if (lower.includes('celebrate') || lower.includes('party') || lower.includes('dance')) {
    return {
      action: 'pet_state',
      payload: { state: 'celebrating' },
      feedback: 'Mochi is celebrating your achievement! 🎉',
      confidence: 0.9,
    };
  }
  if (lower.includes('curious') || lower.includes('look') || lower.includes('inspect')) {
    return {
      action: 'pet_state',
      payload: { state: 'curious' },
      feedback: 'Mochi looks around curiously with wide eyes. 👀',
      confidence: 0.9,
    };
  }
  if (lower.includes('focus') || lower.includes('work') || lower.includes('deep work')) {
    return {
      action: 'pet_state',
      payload: { state: 'focused' },
      feedback: 'Mochi entered focus mode with you. 🧘',
      confidence: 0.9,
    };
  }

  // If input starts with timer digits directly, e.g. "10m" or "25 min"
  const bareDuration = parseDurationToSeconds(lower);
  if (bareDuration) {
    return {
      action: 'timer_start',
      payload: { seconds: bareDuration, label: 'Quick Timer' },
      feedback: `Started a ${Math.round(bareDuration / 60)}m timer.`,
      confidence: 0.8,
    };
  }

  return {
    action: 'unknown',
    feedback: `Mochi heard: "${text}". Type "help" to see available commands or click the tabs above.`,
    confidence: 0.1,
  };
}
