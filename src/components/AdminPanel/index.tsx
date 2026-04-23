import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, MessageSquare, X, Send, Wallet, TrendingUp, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useSettings } from '../../store/settings';
import './AdminPanel.css';

interface AdminStats {
  moderation: {
    mutedCount: number;
    violations: Record<string, number>;
  };
  finance: {
    total_players_balance: number;
    total_system_profit: number;
    total_referral_paid: number;
    total_withdrawals: number;
    active_rounds_count: number;
  } | null;
  settings?: {
    botsEnabled: boolean;
    fakeOnlineEnabled: boolean;
  };
  timestamp: string;
}

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const labels = {
  ru: {
    title: 'Панель управления',
    loginTitle: 'Токен администратора',
    loginButton: 'Подключить',
    invalid: 'Токен обязателен',
    finance: 'Финансовый контроль',
    liabilities: 'Баланс игроков',
    profit: 'Чистая прибыль',
    liquidity: 'Резерв ликвидности',
    muted: 'Мутов',
    violations: 'Нарушений',
    broadcast: 'Системное сообщение',
    refresh: 'Обновить',
  },
  en: {
    title: 'Admin Panel',
    loginTitle: 'Admin token',
    loginButton: 'Connect',
    invalid: 'Token is required',
    finance: 'Financial control',
    liabilities: 'Player liabilities',
    profit: 'Net profit',
    liquidity: 'Liquidity reserve',
    muted: 'Muted',
    violations: 'Violations',
    broadcast: 'System message',
    refresh: 'Refresh',
  },
} as const;

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [broadcastMessage, setBroadcastMessage] = React.useState('');
  const [adminToken, setAdminToken] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [loading, setLoading] = React.useState(false);
  const { language } = useSettings();
  const ui = labels[language === 'ru' ? 'ru' : 'en'];
  const apiUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

  const fetchStats = React.useCallback(async () => {
    if (!adminToken) {
      setError(ui.invalid);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/admin/stats`, {
        headers: { 'X-Admin-Token': adminToken },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Admin request failed');
      }
      setStats(data);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Admin request failed');
    } finally {
      setLoading(false);
    }
  }, [adminToken, apiUrl, ui.invalid]);

  React.useEffect(() => {
    if (isOpen && adminToken) {
      void fetchStats();
    }
  }, [isOpen, adminToken, fetchStats]);

  const handleBroadcast = async () => {
    if (!adminToken || !broadcastMessage.trim()) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/admin/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify({ message: broadcastMessage }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Broadcast failed');
      }
      setBroadcastMessage('');
      setError(null);
    } catch (broadcastError) {
      setError(broadcastError instanceof Error ? broadcastError.message : 'Broadcast failed');
    }
  };

  const liquidity = stats?.finance && stats.finance.total_players_balance > 0
    ? ((stats.finance.total_system_profit / stats.finance.total_players_balance) * 100).toFixed(1)
    : '0.0';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="admin-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="admin-modal premium-glass" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(event) => event.stopPropagation()}>
            <div className="admin-header">
              <h2><Shield size={20} className="admin-glow-icon" /> {ui.title}</h2>
              <button className="admin-close" onClick={onClose}><X size={18} /></button>
            </div>

            <div className="admin-login">
              <div className="admin-input-group">
                <Shield size={18} className="input-icon" />
                <input
                  type="password"
                  placeholder={ui.loginTitle}
                  value={adminToken}
                  onChange={(event) => setAdminToken(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void fetchStats();
                    }
                  }}
                />
              </div>
              <button className="admin-login-btn" onClick={() => void fetchStats()}>{ui.loginButton}</button>
              {error && <div className="admin-error-msg">{error}</div>}
            </div>

            {stats && (
              <div className="admin-content">
                <div className="admin-section-title">{ui.finance}</div>
                <div className="admin-finance-grid">
                  <div className="stat-card gold">
                    <Wallet size={18} />
                    <div className="stat-info">
                      <span className="stat-label">{ui.liabilities}</span>
                      <span className="stat-value">${stats.finance?.total_players_balance.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  <div className="stat-card green">
                    <TrendingUp size={18} />
                    <div className="stat-info">
                      <span className="stat-label">{ui.profit}</span>
                      <span className="stat-value">${stats.finance?.total_system_profit.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>

                <div className="liquidity-badge">
                  <AlertTriangle size={14} />
                  <span>{ui.liquidity}: {liquidity}%</span>
                </div>

                <div className="admin-stats">
                  <div className="stat-card mini">
                    <Users size={16} />
                    <span>{ui.muted}: {stats.moderation.mutedCount}</span>
                  </div>
                  <div className="stat-card mini">
                    <MessageSquare size={16} />
                    <span>{ui.violations}: {Object.keys(stats.moderation.violations).length}</span>
                  </div>
                </div>

                <div className="admin-section">
                  <h3>{ui.broadcast}</h3>
                  <div className="admin-broadcast">
                    <input value={broadcastMessage} onChange={(event) => setBroadcastMessage(event.target.value)} />
                    <button onClick={handleBroadcast}>
                      <Send size={16} /> Send
                    </button>
                  </div>
                </div>

                <div className="admin-section">
                  <h3>Управление игрой</h3>
                  <div className="admin-settings-grid">
                    <div className="setting-item">
                      <span>Имитация ботов</span>
                      <button 
                        className={`toggle-btn ${stats.settings?.botsEnabled ? 'active' : ''}`}
                        onClick={async () => {
                          const response = await fetch(`${apiUrl}/api/admin/settings`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken },
                            body: JSON.stringify({ botsEnabled: !stats.settings?.botsEnabled })
                          });
                          if (response.ok) void fetchStats();
                        }}
                      >
                        {stats.settings?.botsEnabled ? 'ВКЛ' : 'ВЫКЛ'}
                      </button>
                    </div>
                    <div className="setting-item">
                      <span>Фейковый онлайн</span>
                      <button 
                        className={`toggle-btn ${stats.settings?.fakeOnlineEnabled ? 'active' : ''}`}
                        onClick={async () => {
                          const response = await fetch(`${apiUrl}/api/admin/settings`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken },
                            body: JSON.stringify({ fakeOnlineEnabled: !stats.settings?.fakeOnlineEnabled })
                          });
                          if (response.ok) void fetchStats();
                        }}
                      >
                        {stats.settings?.fakeOnlineEnabled ? 'ВКЛ' : 'ВЫКЛ'}
                      </button>
                    </div>
                  </div>
                </div>

                <button className={`admin-refresh ${loading ? 'loading' : ''}`} onClick={() => void fetchStats()} disabled={loading}>
                  <RefreshCcw size={16} className={loading ? 'spin' : ''} />
                  {ui.refresh}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminPanel;
