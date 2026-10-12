import { describe, it, expect } from 'vitest';
import { parseDurationToSeconds, parseLocalCommand } from '../src/shared/command-parser';

describe('Local Command Parser & Duration Extractor', () => {
  it('correctly parses minutes, hours, and seconds into seconds', () => {
    expect(parseDurationToSeconds('10 minutes')).toBe(600);
    expect(parseDurationToSeconds('25 mins')).toBe(1500);
    expect(parseDurationToSeconds('5m')).toBe(300);
    expect(parseDurationToSeconds('1 hour')).toBe(3600);
    expect(parseDurationToSeconds('1 hour 30 minutes')).toBe(5400);
    expect(parseDurationToSeconds('45s')).toBe(45);
    expect(parseDurationToSeconds('90 seconds')).toBe(90);
    expect(parseDurationToSeconds('15')).toBe(900); // bare number defaults to minutes
  });

  it('parses countdown timer commands accurately', () => {
    const res1 = parseLocalCommand('Start a 10-minute timer');
    expect(res1.action).toBe('timer_start');
    expect(res1.payload.seconds).toBe(600);

    const res2 = parseLocalCommand('set timer for 45 mins');
    expect(res2.action).toBe('timer_start');
    expect(res2.payload.seconds).toBe(2700);

    const res3 = parseLocalCommand('Pause timer');
    expect(res3.action).toBe('timer_pause');

    const res4 = parseLocalCommand('Resume timer');
    expect(res4.action).toBe('timer_resume');

    const res5 = parseLocalCommand('Reset timer');
    expect(res5.action).toBe('timer_reset');
  });

  it('parses Pomodoro commands', () => {
    const res1 = parseLocalCommand('Start a Pomodoro session');
    expect(res1.action).toBe('pomodoro_start');
    expect(res1.payload.phase).toBe('focus');

    const res2 = parseLocalCommand('Pomodoro short break');
    expect(res2.action).toBe('pomodoro_start');
    expect(res2.payload.phase).toBe('short-break');
  });

  it('parses water and break reminder commands', () => {
    const resWater = parseLocalCommand('Remind me to drink water in 30 minutes');
    expect(resWater.action).toBe('water_reminder_set');
    expect(resWater.payload.intervalMinutes).toBe(30);

    const resBreak = parseLocalCommand('Remind me to take a break in 50 minutes');
    expect(resBreak.action).toBe('break_reminder_set');
    expect(resBreak.payload.intervalMinutes).toBe(50);
  });

  it('parses task and note additions', () => {
    const resTask = parseLocalCommand('Add task to finalize presentation');
    expect(resTask.action).toBe('task_add');
    expect(resTask.payload.title).toContain('finalize presentation');

    const resNote = parseLocalCommand('Add note: Call doctor at 4pm');
    expect(resNote.action).toBe('note_add');
    expect(resNote.payload.content).toContain('Call doctor at 4pm');
  });

  it('parses pet mood triggers', () => {
    expect(parseLocalCommand('Make Mochi happy').action).toBe('pet_state');
    expect(parseLocalCommand('Go to sleep Mochi').action).toBe('pet_state');
    expect(parseLocalCommand('Celebrate!').action).toBe('pet_state');

    // Emoticons :) and :(
    const smile = parseLocalCommand(':)');
    expect(smile.action).toBe('pet_state');
    expect(smile.payload.state).toBe('smile');

    const sad = parseLocalCommand(':(');
    expect(sad.action).toBe('pet_state');
    expect(sad.payload.state).toBe('sad');

    // Drink log / hydration
    const drink = parseLocalCommand('drink log');
    expect(drink.action).toBe('pet_state');
    expect(drink.payload.state).toBe('hydrated');

    const drank = parseLocalCommand('drank water');
    expect(drank.action).toBe('pet_state');
    expect(drank.payload.state).toBe('hydrated');
  });

  it('handles help and unknown commands safely', () => {
    const help = parseLocalCommand('help');
    expect(help.action).toBe('help');

    const unknown = parseLocalCommand('random unintelligible gibberish 123456');
    expect(unknown.action).toBe('unknown');
  });

  it('AiCompanionService maps parsed commands to executable actions with autoExecuted', async () => {
    const { AiCompanionService } = await import('../src/renderer/services/ai-service');
    const defaultSettings = { provider: 'offline-local' as const };

    // Water reminder
    const waterRes = await AiCompanionService.generateResponse(
      'Remind me to drink water in 30 minutes',
      [],
      defaultSettings
    );
    expect(waterRes.suggestedAction).toBeDefined();
    expect(waterRes.suggestedAction?.type).toBe('set_water_reminder');
    expect(waterRes.suggestedAction?.autoExecuted).toBe(true);
    expect(waterRes.suggestedAction?.payload.intervalMinutes).toBe(30);

    // Pomodoro
    const pomoRes = await AiCompanionService.generateResponse(
      'Start Pomodoro focus session',
      [],
      defaultSettings
    );
    expect(pomoRes.suggestedAction).toBeDefined();
    expect(pomoRes.suggestedAction?.type).toBe('start_pomodoro');
    expect(pomoRes.suggestedAction?.autoExecuted).toBe(true);

    // Pause timer
    const pauseRes = await AiCompanionService.generateResponse(
      'Pause timer',
      [],
      defaultSettings
    );
    expect(pauseRes.suggestedAction?.type).toBe('pause_timer');
    expect(pauseRes.suggestedAction?.autoExecuted).toBe(true);

    // Word boundary check: "this is great" should NOT match "hi" greeting!
    const thisRes = await AiCompanionService.generateResponse(
      'this is a productive day',
      [],
      defaultSettings
    );
    expect(thisRes.text).not.toContain('Hello there!');
    expect(thisRes.text).not.toContain('Hi! Mochi is awake');

    // Genuine greeting: "hi" matches greeting
    const hiRes = await AiCompanionService.generateResponse(
      'hi',
      [],
      defaultSettings
    );
    expect(hiRes.suggestedAction?.type).toBe('start_timer');
  });
});
