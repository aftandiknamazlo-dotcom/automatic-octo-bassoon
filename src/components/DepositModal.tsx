import React, { useState } from 'react';
import BottomSheet from './BottomSheet';
import { Wallet, CheckCircle2, Loader2 } from 'lucide-react';
import './DepositModal.css';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => void;
}

const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const depositOptions = [10, 50, 100, 500];

  const handleDeposit = async (amount: number) => {
    setLoading(true);
    try {
      // @ts-expect-error Telegram WebApp types not available
      const initData = window.Telegram?.WebApp?.initData || '';
      
      const response = await fetch(`${API_URL}/api/payments/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tg-init-data': initData
        },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();
      if (data.success && data.payUrl) {
        // Open the CryptoBot invoice link
        // @ts-expect-error Telegram WebApp types not available
        window.Telegram?.WebApp?.openTelegramLink(data.payUrl);
        onClose();
      } else {
        alert(data.error || 'Ошибка создания платежа');
      }
    } catch (err) {
      console.error('Deposit error:', err);
      alert('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="ПОПОЛНЕНИЕ БАЛАНСА">
      <div className="deposit-content">
        <div className="deposit-info-card">
          <Wallet size={24} className="info-icon" />
          <div className="info-text">
            <h4>CryptoBot Pay</h4>
            <p>Пополнение через официальный кошелек Telegram</p>
          </div>
        </div>

        <div className="fast-deposit">
          <h4 className="fast-deposit-title">ВЫБЕРИТЕ СУММУ ПОПОЛНЕНИЯ</h4>
          <div className="deposit-grid">
            {depositOptions.map((amount) => (
              <button 
                key={amount} 
                className="deposit-option-btn"
                onClick={() => handleDeposit(amount)}
                disabled={loading}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} className="deposit-icon" />}
                <span>{amount} USDT</span>
              </button>
            ))}
          </div>
        </div>

        <div className="secure-badge">
          <CheckCircle2 size={14} className="secure-icon" />
          <span>Средства зачисляются автоматически после оплаты</span>
        </div>
      </div>
    </BottomSheet>
  );
};

export default DepositModal;
