import { describe, it, expect } from 'vitest';
import { classifyApplication } from '../src/main/services/system-activity';

describe('System Activity Application Classifier', () => {
  it('correctly classifies development tools including VS Code and Cursor', () => {
    const vsCode = classifyApplication('Code');
    expect(vsCode.category).toBe('development');
    expect(vsCode.state).toBe('coding');
    expect(vsCode.formattedName).toBe('VS Code');
    expect(vsCode.subtitles.length).toBeGreaterThan(0);

    const fullVsCode = classifyApplication('Visual Studio Code');
    expect(fullVsCode.category).toBe('development');
    expect(fullVsCode.state).toBe('coding');

    const cursor = classifyApplication('Cursor');
    expect(cursor.category).toBe('development');
    expect(cursor.state).toBe('coding');

    const terminal = classifyApplication('Terminal');
    expect(terminal.category).toBe('development');
    expect(terminal.state).toBe('coding');

    const zed = classifyApplication('Zed');
    expect(zed.category).toBe('development');
    expect(zed.state).toBe('coding');
    expect(zed.formattedName).toBe('Zed Editor');

    const sublime = classifyApplication('Sublime Text');
    expect(sublime.category).toBe('development');
    expect(sublime.state).toBe('coding');

    const ghostty = classifyApplication('Ghostty');
    expect(ghostty.category).toBe('development');
    expect(ghostty.state).toBe('coding');

    const nvim = classifyApplication('Neovim');
    expect(nvim.category).toBe('development');
    expect(nvim.state).toBe('coding');
  });

  it('correctly classifies design tools like Figma', () => {
    const figma = classifyApplication('Figma');
    expect(figma.category).toBe('design');
    expect(figma.state).toBe('curious');
    expect(figma.title).toContain('Figma');
  });

  it('correctly classifies browsers like Chrome and Arc', () => {
    const chrome = classifyApplication('Google Chrome');
    expect(chrome.category).toBe('browser');
    expect(chrome.state).toBe('thinking');

    const arc = classifyApplication('Arc');
    expect(arc.category).toBe('browser');
    expect(arc.state).toBe('thinking');
  });

  it('correctly classifies communication apps like Slack and Discord', () => {
    const slack = classifyApplication('Slack');
    expect(slack.category).toBe('communication');
    expect(slack.state).toBe('happy');
  });

  it('correctly classifies entertainment/music apps like Spotify', () => {
    const spotify = classifyApplication('Spotify');
    expect(spotify.category).toBe('entertainment');
    expect(spotify.state).toBe('listening');
  });

  it('provides safe, formatted fallbacks for unknown applications', () => {
    const customApp = classifyApplication('calculator');
    expect(customApp.formattedName).toBe('Calculator');
    expect(customApp.category).toBe('productivity');
    expect(customApp.title).toBe('Calculator Active');
  });
});
