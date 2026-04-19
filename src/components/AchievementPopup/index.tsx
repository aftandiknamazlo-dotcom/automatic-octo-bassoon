import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { Achievement } from '../../store/achievements';
import './AchievementPopup.css';

interface AchievementPopupProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementPopup: React.FC<AchievementPopupProps> = ({ achievement, onClose }) => {
  if (!achievement) return null;

  const rarityColors = {
    common: '#95a5a6',
    rare: '#3498db',
    epic: '#9b59b6',
    legendary: '#f39c12'
  };

  return (
    <AnimatePresence>
      <motion.div
        className="achievement-popup"
        initial={{ y: -100, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -100, opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        style={{ '--rarity-color': rarityColors[achievement.rarity] } as React.CSSProperties}
      >
        <div className="achievement-popup-glow" />
        
        <motion.div 
          className="achievement-popup-icon"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className="achievement-popup-emoji">{achievement.icon}</span>
          <Sparkles className="achievement-popup-sparkle" size={20} />
        </motion.div>

        <div className="achievement-popup-content">
          <span className="achievement-popup-label">ДОСТИЖЕНИЕ РАЗБЛОКИРОВАНО!</span>
          <h3 className="achievement-popup-title">{achievement.title}</h3>
          <p className="achievement-popup-desc">{achievement.description}</p>
        </div>

        <motion.button 
          className="achievement-popup-close"
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ×
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
};

export default AchievementPopup;
