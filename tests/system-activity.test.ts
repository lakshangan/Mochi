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

  it('correctly classifies messaging apps like WhatsApp, Telegram, and iMessage', () => {
    const whatsapp = classifyApplication('WhatsApp');
    expect(whatsapp.category).toBe('communication');
    expect(whatsapp.state).toBe('happy');
    expect(whatsapp.title).toContain('WhatsApp');

    const telegram = classifyApplication('Telegram');
    expect(telegram.category).toBe('communication');
    expect(telegram.state).toBe('happy');

    const imessage = classifyApplication('Messages');
    expect(imessage.category).toBe('communication');
    expect(imessage.state).toBe('happy');
  });

  it('correctly classifies social media apps like X/Twitter, Instagram, and Reddit', () => {
    const twitter = classifyApplication('Twitter');
    expect(twitter.category).toBe('communication');
    expect(twitter.state).toBe('curious');

    const insta = classifyApplication('Instagram');
    expect(insta.category).toBe('communication');
    expect(insta.state).toBe('curious');

    const reddit = classifyApplication('Reddit');
    expect(reddit.category).toBe('communication');
    expect(reddit.state).toBe('curious');
  });

  it('correctly classifies browser tab URLs for YouTube, ChatGPT, and WhatsApp Web', () => {
    const youtube = classifyApplication('Arc', 'Song Title - YouTube', 'https://www.youtube.com/watch?v=123');
    expect(youtube.category).toBe('entertainment');
    expect(youtube.state).toBe('listening');
    expect(youtube.title).toContain('YouTube');

    const chatgpt = classifyApplication('Google Chrome', 'ChatGPT', 'https://chatgpt.com/c/123');
    expect(chatgpt.category).toBe('productivity');
    expect(chatgpt.state).toBe('thinking');
    expect(chatgpt.title).toContain('ChatGPT');

    const waWeb = classifyApplication('Safari', 'WhatsApp', 'https://web.whatsapp.com');
    expect(waWeb.category).toBe('communication');
    expect(waWeb.state).toBe('happy');
    expect(waWeb.title).toContain('WhatsApp');
  });

  it('provides safe, formatted fallbacks for unknown applications', () => {
    const customApp = classifyApplication('calculator');
    expect(customApp.formattedName).toBe('Calculator');
    expect(customApp.category).toBe('productivity');
    expect(customApp.title).toBe('Calculator Active');
  });
});
