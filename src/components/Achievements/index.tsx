import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Lock, X, Sparkles, Dices, Gem, Flame, 
  TrendingUp, Coins, Zap, Target, Waves, Crown, 
  Star, Banknote, Medal 
} from 'lucide-react';
import { ACHIEVEMENTS, achievementsStore } from '../../store/achievements';
import { useSettings } from '../../store/settings';
import { translations } from '../../i18n/translations';
import './Achievements.css';

// Icon mapping
type IconComponent = React.ComponentType<{ size?: number; className?: string }>;
const IconMap: Record<string, IconComponent> = {
  Trophy, Lock, X, Sparkles, Dices, Gem, Flame, 
  TrendingUp, Coins, Zap, Target, Waves, Crown, 
  Star, Banknote, Medal
};

interface AchievementsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Achievements: React.FC<AchievementsProps> = ({ isOpen, onClose }) => {
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [newUnlocks, setNewUnlocks] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all');
  const { language } = useSettings();
  const t = translations[language];

  useEffect(() => {
    const progress = achievementsStore.getProgress();
    setUnlocked(progress.unlockedAchievements);

    // Subscribe to new achievements
    const unsubscribe = achievementsStore.subscribe((newIds) => {
      setNewUnlocks(newIds);
      setUnlocked(prev => [...prev, ...newIds]);
      
      // Clear "new" status after 3 seconds
      setTimeout(() => setNewUnlocks([]), 3000);
    });

    return () => { unsubscribe(); };
  }, []);

  const filteredAchievements = ACHIEVEMENTS.filter(ach => {
    if (activeTab === 'unlocked') return unlocked.includes(ach.id);
    if (activeTab === 'locked') return !unlocked.includes(ach.id);
    return true;
  });

  const isNew = (id: string) => newUnlocks.includes(id);
  const isUnlocked = (id: string) => unlocked.includes(id);

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'Обычное';
      case 'rare': return 'Редкое';
      case 'epic': return 'Эпическое';
      case 'legendary': return 'Легендарное';
      default: return rarity;
    }
  };

  const rarityColors = {
    common: '#95a5a6',
    rare: '#3498db',
    epic: '#9b59b6',
    legendary: '#f39c12'
  };

  const renderIcon = (iconName: string, size = 20) => {
    const IconComp = IconMap[iconName] || Trophy;
    return <IconComp size={size} />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="achievements-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="achievements-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="achievements-header">
              <h2><Trophy size={24} /> {t.achievements || 'ДОСТИЖЕНИЯ'}</h2>
              <button className="achievements-close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="achievements-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }}
                />
              </div>
              <span className="progress-text">
                {unlocked.length} / {ACHIEVEMENTS.length} разблокировано
              </span>
            </div>

            <div className="achievements-tabs">
              <button 
                className={activeTab === 'all' ? 'active' : ''} 
                onClick={() => setActiveTab('all')}
              >
                Все
              </button>
              <button 
                className={activeTab === 'unlocked' ? 'active' : ''} 
                onClick={() => setActiveTab('unlocked')}
              >
                Получено
              </button>
              <button 
                className={activeTab === 'locked' ? 'active' : ''} 
                onClick={() => setActiveTab('locked')}
              >
                Заблокировано
              </button>
            </div>

            <div className="achievements-list">
              {filteredAchievements.map((ach) => (
                <motion.div
                  key={ach.id}
                  className={`achievement-card ${isUnlocked(ach.id) ? 'unlocked' : 'locked'} ${isNew(ach.id) ? 'new' : ''}`}
                  initial={isNew(ach.id) ? { scale: 0.8, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ 
                    '--rarity-color': rarityColors[ach.rarity],
                    borderColor: isUnlocked(ach.id) ? rarityColors[ach.rarity] : undefined
                  } as React.CSSProperties}
                >
                  <div className="achievement-icon">
                    {isUnlocked(ach.id) ? (
                      <div className="achievement-icon-wrapper">
                        {renderIcon(ach.icon, 24)}
                      </div>
                    ) : (
                      <Lock size={20} />
                    )}
                    {isNew(ach.id) && (
                      <motion.div 
                        className="achievement-sparkle"
                        initial={{ scale: 0, rotate: 0 }}
                        animate={{ scale: 1, rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Sparkles size={16} />
                      </motion.div>
                    )}
                  </div>

                  <div className="achievement-info">
                    <div className="achievement-title-row">
                      <h3>{ach.title}</h3>
                      <span className={`achievement-rarity ${ach.rarity}`}>
                        {getRarityLabel(ach.rarity)}
                      </span>
                    </div>
                    <p className="achievement-desc">{ach.description}</p>
                  </div>

                  {isNew(ach.id) && (
                    <motion.div 
                      className="achievement-new-badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      NEW!
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Achievements;
