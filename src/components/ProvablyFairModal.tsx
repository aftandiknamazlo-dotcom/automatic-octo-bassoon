import React, { useState } from 'react';
import { ShieldCheck, Copy, CheckCircle2, Calculator, RefreshCcw } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { calculateRoll } from '../provablyFair';
import './ProvablyFairModal.css';

interface ProvablyFairModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverSeedHash: string;
}

const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({ isOpen, onClose, serverSeedHash }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'verify'>('info');
  const [vServerSeed, setVServerSeed] = useState('');
  const [vClientSeed, setVClientSeed] = useState('');
  const [vNonce, setVNonce] = useState('1');
  const [vResult, setVResult] = useState<number | null>(null);

  const handleCopy = () => {
    if (serverSeedHash) {
      navigator.clipboard.writeText(serverSeedHash).catch(() => {});
    }
  };

  const handleVerify = async () => {
    if (!vServerSeed || !vClientSeed || !vNonce) return;
    const res = await calculateRoll(vServerSeed, vClientSeed, parseInt(vNonce));
    setVResult(res);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="ЧЕСТНАЯ ИГРА">
      <div className="provably-fair-content">
        <div className="pf-tabs">
          <button 
            className={`pf-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Инфо
          </button>
          <button 
            className={`pf-tab ${activeTab === 'verify' ? 'active' : ''}`}
            onClick={() => setActiveTab('verify')}
          >
            Проверить
          </button>
        </div>

        {activeTab === 'info' ? (
          <>
            <div className="pf-hero">
              <ShieldCheck size={44} className="pf-icon" />
              <h3 className="pf-title">PROVABLY FAIR</h3>
              <p className="pf-desc">Абсолютная прозрачность. Исход игры формируется до её начала и не может быть изменен.</p>
            </div>

            <div className="pf-section">
              <label className="pf-label">ТЕКУЩИЙ HASH РАУНДА</label>
              <div className="pf-hash-box">
                <span className="pf-hash-text">{serverSeedHash || '—'}</span>
                <button className="pf-copy-btn" onClick={handleCopy} aria-label="Copy hash">
                  <Copy size={14} />
                </button>
              </div>
              <p className="pf-hint">Это зашифрованный результат игры. После окончания раунда мы раскроем ключ, и вы сможете проверить, что результат не был подделан.</p>
            </div>

            <div className="pf-steps">
              <div className="pf-step">
                <CheckCircle2 size={16} className="pf-step-icon" />
                <span>Hash показывается ДО начала раунда</span>
              </div>
              <div className="pf-step">
                <CheckCircle2 size={16} className="pf-step-icon" />
                <span>Ключ раскрывается ПОСЛЕ раунда</span>
              </div>
              <div className="pf-step">
                <CheckCircle2 size={16} className="pf-step-icon" />
                <span>Вы можете проверить результат</span>
              </div>
            </div>
          </>
        ) : (
          <div className="pf-verifier">
            <div className="verifier-header">
              <Calculator size={20} className="pf-accent-icon" />
              <h4>Калькулятор раунда</h4>
            </div>

            <div className="verifier-form">
              <div className="verifier-input-group">
                <label>Server Seed (Revealed)</label>
                <input 
                  type="text" 
                  placeholder="Paste revealed server seed..." 
                  value={vServerSeed}
                  onChange={(e) => setVServerSeed(e.target.value)}
                />
              </div>

              <div className="verifier-input-group">
                <label>Client Seed</label>
                <input 
                  type="text" 
                  placeholder="Paste client seed..." 
                  value={vClientSeed}
                  onChange={(e) => setVClientSeed(e.target.value)}
                />
              </div>

              <div className="verifier-input-group">
                <label>Nonce (Round #)</label>
                <input 
                  type="number" 
                  placeholder="Round number" 
                  value={vNonce}
                  onChange={(e) => setVNonce(e.target.value)}
                />
              </div>

              <button className="verifier-action-btn" onClick={handleVerify}>
                <RefreshCcw size={16} />
                Рассчитать результат
              </button>
            </div>

            {vResult !== null && (
              <div className="verifier-result-card">
                <div className="v-res-label">Результат раунда</div>
                <div className="v-res-value">{vResult.toFixed(2)}</div>
                <div className="v-res-badge">
                  <CheckCircle2 size={12} />
                  Verified on your device
                </div>
              </div>
            )}
            
            <p className="verifier-note">
              Введите данные из истории раунда. Если вычисления совпадут с результатом в профиле, значит, сервер не менял результат.
            </p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

export default ProvablyFairModal;
