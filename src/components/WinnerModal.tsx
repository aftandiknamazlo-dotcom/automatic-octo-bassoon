import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { useAudio } from '../hooks/useAudio';
import type { Player } from '../types';
import { translations } from '../i18n/translations';
import type { Language } from '../i18n/translations';
import './WinnerModal.css';

interface WinnerModalProps {
  winner: Player;
  winAmount: number;
  totalBank: number;
  commission: number;
  roll: number;
  onContinue: () => void;
  language: Language;
}

const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  winAmount,
  totalBank,
  commission,
  roll,
  onContinue,
  language
}) => {
  const t = translations[language];
  const [displayAmount, setDisplayAmount] = useState(0);
  const { playWin, playLose } = useAudio();
  const isUserWin = winner.id === 'user';

  // Generate confetti styles once using useMemo to avoid Math.random() during render
  const confettiStyles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      left: `${Math.random() * 100}%`,
      backgroundColor: i % 3 === 0 ? '#fdcb6e' : i % 3 === 1 ? winner.color : '#fff',
      animationDelay: `${Math.random() * 2}s`,
      animationDuration: `${2.5 + Math.random() * 1.5}s`,
      transform: `scale(${0.5 + Math.random() * 0.5})`
    }));
  }, [winner.color]);

  useEffect(() => {
    if (isUserWin) {
      playWin();
    } else {
      playLose();
    }
  }, [playWin, playLose, isUserWin]);

  // Animated counter
  useEffect(() => {
    const end = winAmount;
    const duration = 1800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setDisplayAmount(end * easeProgress);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [winAmount]);

  return (
    <motion.div 
      className="winner-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Ambient spotlight */}
      <div className="winner-spotlight" style={{ backgroundColor: winner.color }} />

      {/* Confetti */}
      <div className="confetti-container">
        {confettiStyles.map((style, i) => (
          <div
            key={i}
            className="confetti-piece-css"
            style={style}
          />
        ))}
      </div>

      {/* Card */}
      <motion.div 
        className="winner-card"
        initial={{ scale: 0.85, y: 60, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 1.05, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 200 }}
      >
        {/* Header Badge */}
        <div className="winner-badge">
          <Crown size={16} className="badge-icon" />
          <span>{isUserWin ? (language === 'ru' ? 'ВЫ ПОБЕДИЛИ!' : 'YOU WON!') : t.round_winner}</span>
        </div>

        {/* Avatar */}
        <div className="winner-hero">
          <div className="winner-avatar-ring" style={{ borderColor: winner.color }}>
            <UserAvatar name={winner.name} size={80} avatar={winner.avatar} />
          </div>
          <h2 className="winner-name">{winner.name}</h2>
          <div className="winner-chance" style={{ backgroundColor: winner.color }}>
            {winner.percentage.toFixed(0)}% шанс
          </div>
        </div>

        {/* Prize */}
        <div className="prize-card">
          <span className="prize-label">{t.win_amount}</span>
          <div className="prize-row">
            <span className="prize-currency">USDT</span>
            <span className="prize-value">
              {displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="prize-divider" />

          <div className="prize-details">
            <div className="detail-item">
              <span className="detail-label">{t.round_bank}</span>
              <span className="detail-value">${totalBank.toFixed(2)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">TICKET</span>
              <span className="detail-value" style={{ color: winner.color }}>#{(roll * 100).toFixed(4)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">КОМИССИЯ</span>
              <span className="detail-value">${commission.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <motion.button 
          className="continue-btn"
          whileTap={{ scale: 0.96 }}
          onClick={onContinue}
          style={{ 
            background: `linear-gradient(135deg, ${winner.color} 0%, #000 180%)`,
            boxShadow: `0 10px 30px ${winner.color}40`
          }}
        >
          {t.done}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default WinnerModal;
