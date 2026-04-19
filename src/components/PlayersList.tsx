import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import UserAvatar from './UserAvatar';
import type { Player } from '../types';
import { translations } from '../i18n/translations';
import type { Language } from '../i18n/translations';
import './PlayersList.css';

interface PlayersListProps {
  players: Player[];
  totalBank: number;
  language: Language;
}

const PlayerSlip = React.memo(({ p, isMe, t }: { p: Player; isMe: boolean; t: Record<string, string> }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`player-card-pro ${isMe ? 'is-me' : ''}`}
      style={{ '--player-color': p.color } as React.CSSProperties}
    >
      <div className="p-avatar-wrap-pro">
        <div className="p-avatar-pro">
          <UserAvatar name={p.name} size={42} avatar={p.avatar} />
        </div>
        <div className="p-chance-badge-pro" style={{ backgroundColor: p.color }}>
          {p.percentage.toFixed(1)}%
        </div>
      </div>

      <div className="p-info-pro">
        <span className="p-name-pro">{p.name}</span>
        <span className="p-sub-detail-pro">{p.bet > 0 ? (t.language === 'ru' ? 'Сделал ставку' : 'Placed a bet') : ''}</span>
      </div>

      <div className="p-val-wrap-pro">
        <span className="p-amount-pro">{p.bet.toFixed(2)}</span>
        <span className="p-unit-pro">USDT</span>
      </div>
    </motion.div>
  );
});

const PlayersList: React.FC<PlayersListProps> = ({ players, totalBank, language }) => {
  const t = translations[language];
  const isUser = (id: string) => id === 'user';

  // Sort players by percentage descending (highest chance first)
  const sortedPlayers = React.useMemo(() => {
    return [...players].sort((a, b) => b.percentage - a.percentage);
  }, [players]);

  return (
    <div className="players-list-pro">
      <div className="list-header-pro">
        <div className="title-group-pro">
          <span className="title-pro">{language === 'ru' ? 'Лента ставок' : 'Bets Feed'}</span>
          <div className="list-count-pro">
            {players.length} {language === 'ru' ? 'Игроков' : 'Players'}
          </div>
        </div>
        <div className="bank-display-pro">
          <span className="bank-label-pro">JACKPOT</span>
          <span className="bank-val-pro">{totalBank.toFixed(2)} <small>USDT</small></span>
        </div>
      </div>

      <div className="players-grid-pro">
        <AnimatePresence mode="popLayout">
          {sortedPlayers.length > 0 ? (
            sortedPlayers.map((p) => (
              <PlayerSlip key={p.id} p={p} isMe={isUser(p.id)} t={t} />
            ))
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="empty-state-pro"
            >
              <Zap size={32} className="empty-zap-gold" />
              <span className="empty-title-pro">{language === 'ru' ? 'ОЖИДАНИЕ УЧАСТНИКОВ' : 'WAITING FOR ENTRIES'}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default React.memo(PlayersList);
