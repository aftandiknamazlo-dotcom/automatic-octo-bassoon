import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Smile } from 'lucide-react';
import { useSettings } from '../../store/settings';
import { translations } from '../../i18n/translations';
import './Chat.css';

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  avatar?: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onlineCount: number;
}

const EMOJIS = ['🔥', '💎', '🎰', '🍀', '🚀', '🎯', '💰', '🏆', '👑', '⭐', '🎲', '💵'];

export const Chat: React.FC<ChatProps> = ({
  messages,
  onSendMessage,
  isOpen,
  onToggle,
  onlineCount
}) => {
  const [input, setInput] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { language } = useSettings();
  const t = translations[language];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    
    onSendMessage(trimmed);
    setInput('');
    setShowEmojis(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(language === 'ru' ? 'ru-RU' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chat-panel"
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header__info">
                <h3>{t.chat || 'ЧАТ'}</h3>
                <span className="chat-header__online">
                  {onlineCount} {t.online || 'онлайн'}
                </span>
              </div>
              <button className="chat-header__close" onClick={onToggle} data-testid="chat-close">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <MessageCircle size={40} opacity={0.3} />
                  <p>{t.chatEmpty || 'Напишите первое сообщение!'}</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    className={`chat-message ${msg.isSystem ? 'chat-message--system' : ''}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {!msg.isSystem && (
                      <div className="chat-message__avatar">
                        {msg.avatar ? (
                          <img src={msg.avatar} alt={msg.playerName} />
                        ) : (
                          <span>{msg.playerName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    )}
                    <div className="chat-message__content">
                      <div className="chat-message__meta">
                        {!msg.isSystem && (
                          <span className="chat-message__name">{msg.playerName}</span>
                        )}
                        <span className="chat-message__time">{formatTime(msg.timestamp)}</span>
                      </div>
                      <p className="chat-message__text">{msg.text}</p>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojis && (
                <motion.div
                  className="chat-emojis"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      className="chat-emoji-btn"
                      onClick={() => addEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="chat-input">
              <button
                className="chat-input__emoji"
                onClick={() => setShowEmojis(!showEmojis)}
              >
                <Smile size={18} />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.chatPlaceholder || 'Написать сообщение...'}
                maxLength={200}
                data-testid="chat-input"
              />
              <button
                className="chat-input__send"
                onClick={handleSend}
                disabled={!input.trim()}
                data-testid="chat-send"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chat;
