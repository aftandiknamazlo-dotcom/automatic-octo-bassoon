import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BottomSheet from './BottomSheet';
import { History, ChevronDown, Copy, ShieldCheck } from 'lucide-react';
import type { GameRound } from '../types';
import './HistoryModal.css';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history?: GameRound[];
}

const HistoryItem = ({ game, index }: { game: GameRound; index: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className={`history-item-wrap ${isExpanded ? 'expanded' : ''}`}>
      <motion.div 
        className="history-item"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="history-col history-id">
          #{String(game.gameId).slice(-4).toUpperCase()}
        </div>
        <div className="history-col history-winner">
          <span className="winner-name">{game.winner?.name || '—'}</span>
        </div>
        <div className="history-col history-amount">
          <span className="amount-value">${game.winAmount.toFixed(2)}</span>
        </div>
        <div className="history-col history-action">
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
            <ChevronDown size={16} opacity={0.5} />
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="history-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="details-inner">
              <div className="detail-row">
                <div className="detail-label">ROUND HASH (PRE-GAME)</div>
                <div className="detail-value-wrap">
                  <code className="detail-code">{game.hash}</code>
                  <button onClick={() => copyToClipboard(game.hash)} className="detail-copy">
                    <Copy size={12} />
                  </button>
                </div>
              </div>
              
              {game.serverSeed && (
                <div className="detail-row highlight">
                  <div className="detail-label">SERVER SEED (REVEALED)</div>
                  <div className="detail-value-wrap">
                    <code className="detail-code">{game.serverSeed}</code>
                    <button onClick={() => copyToClipboard(game.serverSeed!)} className="detail-copy">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>
              )}

              <div className="detail-verify-hint">
                <ShieldCheck size={12} />
                <span>Используйте эти данные в меню "Честная игра" для верификации</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history = [] }) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="ИСТОРИЯ ИГР">
      <div className="history-content">
        {history.length > 0 ? (
          <>
            <div className="history-table-header">
              <span>ID</span>
              <span>ПОБЕДИТЕЛЬ</span>
              <span>ВЫИГРЫШ</span>
              <span>ИНФО</span>
            </div>
            
            <div className="history-list">
              {history.map((game, index) => (
                <HistoryItem key={game.gameId} game={game} index={index} />
              ))}
            </div>
          </>
        ) : (
          <div className="history-empty">
            <History size={40} className="empty-history-icon" />
            <span className="empty-history-text">Пока нет завершённых раундов</span>
            <span className="empty-history-sub">Сыграйте свою первую игру!</span>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

export default HistoryModal;
