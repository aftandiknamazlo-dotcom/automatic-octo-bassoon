import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, History, Globe, MessageSquare } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { translations } from '../i18n/translations';
import type { Language } from '../i18n/translations';
import './Header.css';

interface HeaderProps {
  onlineCount: number;
  userName: string;
  userAvatar: string;
  onOpenHash: () => void;
  onOpenHistory: () => void;
  onOpenProfile: () => void;
  onToggleChat: () => void;
  serverSeedHash: string;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onlineCount, 
  userName,
  userAvatar,
  onOpenHash,
  onOpenHistory,
  onOpenProfile,
  onToggleChat,
  serverSeedHash,
  language,
  onLanguageChange
}) => {
  const [isLangOpen, setIsLangOpen] = React.useState(false);
  const t = translations[language];
  const shortHash = serverSeedHash 
    ? `${serverSeedHash.slice(0, 6)}...${serverSeedHash.slice(-6)}`
    : '—';

  return (
    <header className="header-pro-elite">
      {/* Top Bar: Provably Fair Ribbon */}
      <div className="fair-ribbon" onClick={onOpenHash}>
        <div className="ribbon-content">
          <ShieldCheck size={11} className="ribbon-icon" />
          <span className="ribbon-text">{t.fair_play} ACTIVE</span>
          <div className="ribbon-dot" />
          <span className="ribbon-hash">{shortHash}</span>
        </div>
      </div>

      <div className="header-elite__main">
        <div className="header-elite__profile">
          <motion.div 
            className="elite-avatar-wrap"
            whileTap={{ scale: 0.94 }}
            onClick={onOpenProfile}
          >
            <div className="avatar-orbit-glow" />
            <div className="avatar-orbit-ring" />
            <UserAvatar name={userName} size={44} avatar={userAvatar} />
            <div className="online-status-indicator" />
          </motion.div>
          
          <div className="profile-info-lite" onClick={onOpenProfile}>
            <span className="elite-user-name">{userName}</span>
            <div className="online-pill">
              <span className="pill-dot" />
              <span>{onlineCount} {t.online.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="header-elite__actions">
          <motion.button 
            className="header-history-btn"
            whileTap={{ scale: 0.9 }}
            onClick={onToggleChat}
            title={t.chat}
          >
            <MessageSquare size={18} />
          </motion.button>

          <motion.button 
            className="header-history-btn"
            whileTap={{ scale: 0.9 }}
            onClick={onOpenHistory}
            title={t.history}
          >
            <History size={18} />
          </motion.button>

          <div className="lang-dropdown-container">
            <motion.button 
              className="lang-trigger-btn"
              onClick={() => setIsLangOpen(!isLangOpen)}
              whileTap={{ scale: 0.95 }}
            >
              <Globe size={16} />
              <span>{language === 'ru' ? '🇷🇺' : language === 'en' ? '🇺🇸' : language === 'tr' ? '🇹🇷' : '🇧🇷'}</span>
            </motion.button>

            {isLangOpen && (
              <>
                <div className="lang-dropdown-overlay" onClick={() => setIsLangOpen(false)} />
                <motion.div 
                  className="lang-menu premium-glass"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                >
                  {(['ru', 'en', 'tr', 'pt'] as Language[]).map(lang => (
                    <button 
                      key={lang}
                      className={`lang-menu-item ${language === lang ? 'active' : ''}`}
                      onClick={() => {
                        onLanguageChange(lang);
                        setIsLangOpen(false);
                      }}
                    >
                      <span className="lang-flag">{lang === 'ru' ? '🇷🇺' : lang === 'en' ? '🇺🇸' : lang === 'tr' ? '🇹🇷' : '🇧🇷'}</span>
                      <span className="lang-label">{lang.toUpperCase()}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header, (prev, next) => {
  return (
    prev.onlineCount === next.onlineCount &&
    prev.userName === next.userName &&
    prev.userAvatar === next.userAvatar &&
    prev.serverSeedHash === next.serverSeedHash &&
    prev.language === next.language
  );
});
