import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { translations } from '../i18n/translations';
import type { Language } from '../i18n/translations';
import './BettingPanel.css';

interface BettingPanelProps {
  balance: number;
  onPlaceBet: (amount: number) => void;
  disabled: boolean;
  betError?: string | null;
  onOpenDeposit: () => void;
  onOpenProfile: () => void;
  timer: number;
  phase: string;
  hasUserBet: boolean;
  language: Language;
}

const BettingPanel: React.FC<BettingPanelProps> = ({
  balance,
  onPlaceBet,
  disabled,
  betError,
  onOpenDeposit,
  onOpenProfile,
  timer,
  phase,
  hasUserBet,
  language
}) => {
  const t = translations[language];
  const [amount, setAmount] = useState<string>('10');

  const parsedAmount = parseFloat(amount) || 0;
  const isWaiting = phase === 'waiting';
  const isSpinning = phase === 'spinning' || phase === 'result';
  const isLocked = timer > 0 && timer <= 5 && phase === 'betting';

  // Button state logic
  const isBtnDisabled = disabled || isSpinning || isLocked || (hasUserBet && isWaiting);

  const getBtnLabel = () => {
    if (isSpinning) return language === 'ru' ? 'ИДЁТ РОЗЫГРЫШ...' : 'SPINNING...';
    if (isLocked) return language === 'ru' ? `ЗАБЛОКИРОВАНО (${timer}с)` : `LOCKED (${timer}s)`;
    if (hasUserBet && phase === 'betting') return language === 'ru' ? '✓ СТАВКА ПРИНЯТА' : '✓ BET PLACED';
    if (hasUserBet && isWaiting) return language === 'ru' ? 'ОЖИДАНИЕ ИГРОКОВ...' : 'WAITING FOR PLAYERS...';
    return t.place_bet;
  };

  const getBtnClass = () => {
    if (isSpinning) return 'console-submit-btn is-spinning';
    if (hasUserBet && phase === 'betting') return 'console-submit-btn is-accepted';
    if (hasUserBet && isWaiting) return 'console-submit-btn is-waiting';
    return 'console-submit-btn';
  };

  return (
    <div className="bet-panel-lite">
      <div className="bet-panel-lite__inner">

        {/* Balance Row */}
        <div className="console-row-top">
          <div className="console-balance" onClick={onOpenDeposit}>
            <span className="c-label">{t.current_balance}</span>
            <div className="c-val-group">
              <span className="c-val">{balance.toFixed(2)}</span>
              <span className="c-unit">USDT</span>
              <div className="c-add">+</div>
            </div>
          </div>

          {/* Phase indicator */}
          <div className={`phase-badge phase-badge--${phase}`}>
            <span className="phase-dot" />
            <span className="phase-label">
              {isWaiting
                ? (language === 'ru' ? 'ОЖИДАНИЕ' : 'IDLE')
                : isSpinning
                ? (language === 'ru' ? 'РОЗЫГРЫШ' : 'SPINNING')
                : isLocked
                ? (language === 'ru' ? 'ЗАБЛОКИРОВАНО' : 'LOCKED')
                : `${timer}${language === 'ru' ? 'с' : 's'}`}
            </span>
          </div>
        </div>

        {/* Input area */}
        <div className="console-input-row">
          <div className="input-box">
            <span className="input-prefix">$</span>
            <input
              type="number"
              className="console-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              disabled={isBtnDisabled}
            />
          </div>
          <div className="console-presets">
            <button
              onClick={() => setAmount((balance * 0.25).toFixed(2))}
              disabled={isBtnDisabled}
            >
              1/4
            </button>
            <button
              onClick={() => setAmount((balance * 0.5).toFixed(2))}
              disabled={isBtnDisabled}
            >
              1/2
            </button>
            <button
              onClick={() => setAmount((parsedAmount * 2).toFixed(2))}
              disabled={isBtnDisabled}
            >
              2×
            </button>
            <button
              onClick={() => setAmount(balance.toFixed(2))}
              disabled={isBtnDisabled}
            >
              MAX
            </button>
          </div>
        </div>

        {/* Action Row */}
        <div className="console-action-row">
          <motion.button
            className={getBtnClass()}
            whileTap={isBtnDisabled ? {} : { scale: 0.97 }}
            disabled={isBtnDisabled}
            onClick={() => {
              if (parsedAmount > 0 && !isBtnDisabled) onPlaceBet(parsedAmount);
            }}
          >
            <div className="btn-shine" />
            <span className="btn-text">{getBtnLabel()}</span>
          </motion.button>

          <button className="console-profile-btn" onClick={onOpenProfile} title="Profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>

        {/* Error display */}
        <AnimatePresence>
          {betError && (
            <motion.div
              className="console-err"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {betError}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default React.memo(BettingPanel, (prev, next) => {
  return (
    prev.balance === next.balance &&
    prev.disabled === next.disabled &&
    prev.betError === next.betError &&
    prev.timer === next.timer &&
    prev.phase === next.phase &&
    prev.hasUserBet === next.hasUserBet &&
    prev.language === next.language
  );
});
