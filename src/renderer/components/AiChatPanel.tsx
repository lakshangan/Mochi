import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AiSettings } from '../../shared/types';
import { AiCompanionService } from '../services/ai-service';
import { Send, Bot, User, Sparkles, CornerDownLeft } from 'lucide-react';
import { ParticlesOrb } from '@/registry/orbe/particles-orb/particles-orb';
import { OrbStatus } from '@/registry/lib/orb-status';

interface AiChatPanelProps {
  messages: ChatMessage[];
  aiSettings: AiSettings;
  onSendMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  onExecuteAction: (action: NonNullable<ChatMessage['suggestedAction']>) => void;
}

export const AiChatPanel: React.FC<AiChatPanelProps> = ({
  messages,
  aiSettings,
  onSendMessage,
  onExecuteAction,
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    // Add user message
    onSendMessage({
      sender: 'user',
      text,
    });
    setInputText('');
    setIsTyping(true);

    try {
      const response = await AiCompanionService.generateResponse(
        text,
        messages,
        aiSettings
      );
      onSendMessage({
        sender: 'mochi',
        text: response.text,
        suggestedAction: response.suggestedAction,
      });
    } catch (err) {
      onSendMessage({
        sender: 'mochi',
        text: "I couldn't process that command right now. Try something like 'Start a 10m timer'.",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const QUICK_PROMPTS = [
    'Start a 25-minute timer',
    'Remind me to drink water in 30 minutes',
    'Add task: Review tomorrow schedule',
    'Start Pomodoro focus session',
    'Make Mochi happy',
    'Tell me a productivity tip',
  ];

  const chatOrbState = isTyping
    ? 'thinking'
    : messages.length > 0 && messages[messages.length - 1].sender === 'mochi'
    ? 'speaking'
    : 'idle';

  return (
    <div className="panel-container chat-layout">
      {/* Animated AI Assistant Particles Orb Hero */}
      <div className="chat-hero-orb-wrap">
        <ParticlesOrb
          state={chatOrbState}
          size={120}
          speed={1}
          colorFrom="#f0abfc"
          colorTo="#818cf8"
        />
        <OrbStatus state={chatOrbState} className="chat-hero-orb-status" />
      </div>

      {/* Quick Prompts Carousel */}
      <div className="quick-prompts-row">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            className="quick-prompt-chip"
            onClick={() => handleSend(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="chat-messages-scroll">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble-row ${msg.sender === 'user' ? 'user-side' : 'mochi-side'}`}
          >
            <div className="chat-avatar">
              {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>

            <div className="chat-bubble-content">
              <div className="chat-bubble-text">{msg.text}</div>

              {msg.suggestedAction && (
                <button
                  className="chat-action-btn"
                  onClick={() => onExecuteAction(msg.suggestedAction!)}
                >
                  <Sparkles size={13} /> {msg.suggestedAction.label}
                </button>
              )}

              <div className="chat-timestamp">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="chat-bubble-row mochi-side">
            <div className="chat-avatar">
              <Bot size={14} />
            </div>
            <div className="chat-bubble-content typing-indicator">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="chat-input-bar"
      >
        <input
          type="text"
          placeholder="Type a command or chat with Mochi..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="chat-input-field"
        />
        <button type="submit" className="btn btn-primary btn-icon" disabled={!inputText.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
