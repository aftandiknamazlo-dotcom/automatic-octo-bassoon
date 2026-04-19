import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Globe, 
  Volume2, 
  VolumeX, 
  Wallet,
  Users,
  Copy,
  Share2,
  ArrowDownLeft,
  ArrowUpRight,
  Trophy
} from 'lucide-react';
import UserAvatar from './UserAvatar';
import { useSettings } from '../store/settings';
import { translations } from '../i18n/translations';
import type { Language } from '../i18n/translations';
import './ProfileModal.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    avatar: string;
    balance: number;
    referralEarnings: number;
    referredCount: number;
  };
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenAchievements?: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  user,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenAchievements,
  language,
  onLanguageChange
}) => {
  const [isLangOpen, setIsLangOpen] = React.useState(false);
  const { soundEnabled, toggleSound } = useSettings();
  const t = translations[language];

  const referralLink = `https://t.me/CryptoSpinx_bot/app?startapp=ref_${user.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
  };

  const shareLink = () => {
    const text = language === 'ru' ? "Присоединяйся к лучшей крипто-рулетке в Telegram! 🚀" : "Join the best crypto roulette on Telegram! 🚀";
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="profile-overlay">
          <motion.div 
            className="profile-modal premium-glass"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <div className="profile-header">
              <button className="close-btn" onClick={onClose}><X size={20} /></button>
              <h2 className="profile-title">{t.profile}</h2>
              <div className="id-badge">ID: {user.id}</div>
            </div>

            <div className="profile-content">
              {/* Settings Card */}
              <div className="profile-settings-card">
                 <div className="setting-row">
                    <div className="setting-label">
                       <Globe size={18} /> {t.language}
                    </div>
                    <div className="setting-actions">
                       <div className="lang-dropdown-container">
                          <button 
                             className="lang-trigger-btn"
                             onClick={() => setIsLangOpen(!isLangOpen)}
                          >
                             <span>{language === 'ru' ? '🇷🇺' : language === 'en' ? '🇺🇸' : language === 'tr' ? '🇹🇷' : '🇧🇷'}</span>
                             <span style={{ fontSize: '12px', opacity: 0.7 }}>{language.toUpperCase()}</span>
                          </button>

                          {isLangOpen && (
                             <>
                                <div className="lang-dropdown-overlay" onClick={() => setIsLangOpen(false)} />
                                <motion.div 
                                   className="lang-menu premium-glass"
                                   initial={{ opacity: 0, y: 5 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   style={{ right: 'auto', left: 0, top: 'calc(100% + 5px)' }}
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
                 <div className="setting-row">
                    <div className="setting-label">
                       {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />} {t.sound}
                    </div>
                    <div className="setting-actions">
                       <button className={`sound-toggle ${soundEnabled ? 'active' : ''}`} onClick={toggleSound}>
                          {soundEnabled ? t.on : t.off}
                       </button>
                    </div>
                 </div>
              </div>

              {/* User Hero */}
              <div className="user-hero-card">
                 <UserAvatar name={user.name} size={80} avatar={user.avatar} />
                 <h3 className="user-name">{user.name}</h3>
                 <div className="user-status-pill">{t.vip_player}</div>
              </div>

              {/* Achievements Button */}
              {onOpenAchievements && (
                <button className="achievements-btn" onClick={onOpenAchievements}>
                  <Trophy size={18} />
                  <span>{t.achievements}</span>
                </button>
              )}

              {/* Balance Section */}
              <div className="balance-grid">
                <div className="main-balance-card">
                   <span className="b-label">{t.current_balance}</span>
                   <div className="b-value">
                     <Wallet size={20} color="var(--accent-blue)" />
                     <span>${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                   </div>
                   <div className="balance-actions">
                     <button className="action-btn deposit" onClick={onOpenDeposit}>
                       <ArrowDownLeft size={18} /> {t.deposit}
                     </button>
                     <button className="action-btn withdraw" onClick={onOpenWithdraw}>
                       <ArrowUpRight size={18} /> {t.withdraw}
                     </button>
                   </div>
                </div>
              </div>

              {/* Referral Section */}
              <div className="referral-system-card">
                <div className="ref-header">
                   <div className="ref-title-wrap">
                      <Users size={18} color="var(--accent-gold)" />
                      <span>{t.ref_system}</span>
                   </div>
                   <div className="ref-percent">{t.ref_percent}</div>
                </div>

                <p className="ref-description">
                  {t.ref_desc}
                </p>

                <div className="ref-stats-row">
                   <div className="stat-item">
                      <span className="s-val">{user.referredCount}</span>
                      <span className="s-lab">{t.friends}</span>
                   </div>
                   <div className="stat-item">
                      <span className="s-val">${user.referralEarnings.toFixed(2)}</span>
                      <span className="s-lab">{t.earned}</span>
                   </div>
                </div>

                <div className="ref-link-group">
                   <div className="ref-link-input">{referralLink.substring(0, 25)}...</div>
                   <div className="ref-btns">
                      <button className="ref-icon-btn" onClick={copyLink}>
                         <Copy size={18} />
                      </button>
                      <button className="ref-share-btn" onClick={shareLink}>
                         <Share2 size={16} /> {t.invite}
                      </button>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
