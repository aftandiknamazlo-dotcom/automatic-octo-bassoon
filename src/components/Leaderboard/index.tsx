import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Award, X } from 'lucide-react';
import { useSettings } from '../../store/settings';
import { translations } from '../../i18n/translations';
import './Leaderboard.css';

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  avatar?: string;
  totalWon: number;
  totalBets: number;
  winRate: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'wins' | 'bets' | 'winRate';

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('wins');
  const { language } = useSettings();
  const t = translations[language];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'wins', label: 'По выигрышам', icon: <Trophy size={16} /> },
    { id: 'bets', label: 'По ставкам', icon: <TrendingUp size={16} /> },
    { id: 'winRate', label: 'По % побед', icon: <Award size={16} /> },
  ];

  const sortedEntries = [...entries].sort((a, b) => {
    switch (activeTab) {
      case 'wins': return b.totalWon - a.totalWon;
      case 'bets': return b.totalBets - a.totalBets;
      case 'winRate': return b.winRate - a.winRate;
      default: return 0;
    }
  }).slice(0, 10);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return 'var(--text-muted)';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="leaderboard-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="leaderboard-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="leaderboard-header">
              <h2><Trophy size={24} /> {t.leaderboard || 'ЛИДЕРБОРД'}</h2>
              <button className="leaderboard-close" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="leaderboard-tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`leaderboard-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="leaderboard-list">
              {sortedEntries.length === 0 ? (
                <div className="leaderboard-empty">
                  <Trophy size={48} opacity={0.3} />
                  <p>Пока нет данных</p>
                </div>
              ) : (
                sortedEntries.map((entry, index) => (
                  <motion.div
                    key={entry.playerId}
                    className="leaderboard-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="leaderboard-rank" style={{ color: getRankColor(entry.rank) }}>
                      {entry.rank <= 3 ? (
                        <Trophy size={20} />
                      ) : (
                        <span>#{entry.rank}</span>
                      )}
                    </div>
                    
                    <div className="leaderboard-avatar">
                      {entry.avatar ? (
                        <img src={entry.avatar} alt={entry.playerName} />
                      ) : (
                        <span>{entry.playerName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="leaderboard-info">
                      <span className="leaderboard-name">{entry.playerName}</span>
                      <span className="leaderboard-stats">
                        {activeTab === 'wins' && `$${formatNumber(entry.totalWon)} выиграно`}
                        {activeTab === 'bets' && `${formatNumber(entry.totalBets)} ставок`}
                        {activeTab === 'winRate' && `${entry.winRate.toFixed(1)}% побед`}
                      </span>
                    </div>

                    <div className="leaderboard-value">
                      {activeTab === 'wins' && `$${entry.totalWon.toFixed(2)}`}
                      {activeTab === 'bets' && entry.totalBets}
                      {activeTab === 'winRate' && `${entry.winRate.toFixed(1)}%`}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Leaderboard;
