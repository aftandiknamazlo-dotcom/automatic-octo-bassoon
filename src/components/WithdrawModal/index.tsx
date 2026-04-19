import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import './WithdrawModal.css';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onWithdraw: (amount: number) => Promise<{ success: boolean; checkUrl?: string; error?: string }>;
}

const MIN_WITHDRAW = 1; // Lowered for CryptoBot

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  balance,
  onWithdraw
}) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkUrl, setCheckUrl] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setAmount('');
    setError(null);
    setSuccess(false);
    setCheckUrl(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    
    // Validation
    if (isNaN(numAmount) || numAmount < MIN_WITHDRAW) {
      setError(`Минимальная сумма вывода: $${MIN_WITHDRAW}`);
      return;
    }
    
    if (numAmount > balance) {
      setError('Недостаточно средств на балансе');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await onWithdraw(numAmount);
      if (result.success) {
        setSuccess(true);
        setCheckUrl(result.checkUrl || null);
        if (!result.checkUrl) {
          setTimeout(() => {
            handleClose();
          }, 3000);
        }
      } else {
        setError(result.error || 'Ошибка при создании чека');
      }
    } catch {
      setError('Произошла ошибка. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  }, [amount, balance, onWithdraw, handleClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="withdraw-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="withdraw-modal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="withdraw-modal__header">
            <h2 className="withdraw-modal__title">
              <Wallet size={20} />
              Вывод средств
            </h2>
            <button className="withdraw-modal__close" onClick={handleClose}>
              <X size={20} />
            </button>
          </div>

          {success ? (
            <div className="withdraw-modal__success">
              <CheckCircle size={48} color="#00b894" />
              <p>Чек успешно создан!</p>
              <span>Сумма списана с баланса. Заберите чек ниже:</span>
              
              {checkUrl && (
                <div className="withdraw-success-link">
                  <div className="success-url-box">
                    <input type="text" readOnly value={checkUrl} className="success-url-input" />
                    <button 
                      type="button"
                      className="copy-url-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(checkUrl);
                      }}
                    >
                      COPY
                    </button>
                  </div>
                  <a href={checkUrl} target="_blank" rel="noopener noreferrer" className="open-url-btn">
                    ОТКРЫТЬ ЧЕК В BOT
                  </a>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="withdraw-modal__form">
              <div className="withdraw-modal__balance">
                <span>Доступно для вывода</span>
                <strong>${balance.toFixed(2)} USDT</strong>
              </div>

              <div className="withdraw-modal__field">
                <label>Сумма вывода (USDT)</label>
                <div className="withdraw-input-group">
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="withdraw-modal__input"
                    disabled={isLoading}
                  />
                  <button 
                    type="button" 
                    className="max-btn"
                    onClick={() => setAmount(String(balance))}
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div className="withdraw-modal-info">
                  <AlertCircle size={16} />
                  <span>Вывод осуществляется через мгновенные чеки CryptoBot. Без комиссии платформы!</span>
              </div>

              {error && (
                <div className="withdraw-modal__error">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="withdraw-modal__submit"
                disabled={isLoading || !amount || parseFloat(amount) > balance}
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'ПОЛУЧИТЬ ЧЕК'}
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WithdrawModal;
