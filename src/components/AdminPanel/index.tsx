import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, MessageSquare, X, Send } from 'lucide-react';
import './AdminPanel.css';

interface AdminStats {
  moderation: {
    mutedCount: number;
    violations: Record<string, number>;
  };
  timestamp: string;
}

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [adminToken, setAdminToken] = useState('demo_mode');
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Forced for demo
  const [error, setError] = useState<string | null>(null);
  
  const [stats] = useState<AdminStats | null>({
    moderation: {
      mutedCount: 42,
      violations: { 'spam': 12, 'scam': 5, 'flood': 25 }
    },
    timestamp: new Date().toISOString()
  });

  const API_URL = import.meta.env.VITE_SOCKET_URL;

  /* 
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchStats();
    }
  }, [isOpen, isAuthenticated]);
  */

  const fetchStats = async () => {
    // Mocked for demo
    console.log('Stats refresh suppressed in demo mode');
  };

  const handleLogin = () => {
    if (adminToken) {
      setIsAuthenticated(true);
      fetchStats();
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    
    try {
      await fetch(`${API_URL}/api/admin/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken
        },
        body: JSON.stringify({ message: broadcastMessage })
      });
      setBroadcastMessage('');
    } catch {
      setError('Failed to broadcast');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="admin-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="admin-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-header">
              <h2><Shield size={20} /> Admin Panel</h2>
              <button className="admin-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            {!isAuthenticated ? (
              <div className="admin-login">
                <input
                  type="password"
                  placeholder="Admin Token"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                />
                <button onClick={handleLogin}>Login</button>
              </div>
            ) : (
              <div className="admin-content">
                {error && <div className="admin-error">{error}</div>}

                <div className="admin-stats">
                  <div className="stat-card">
                    <Users size={20} />
                    <span>Muted Users: {stats?.moderation.mutedCount || 0}</span>
                  </div>
                  <div className="stat-card">
                    <MessageSquare size={20} />
                    <span>Violations: {Object.keys(stats?.moderation.violations || {}).length}</span>
                  </div>
                </div>

                <div className="admin-section">
                  <h3>Broadcast Message</h3>
                  <div className="admin-broadcast">
                    <input
                      type="text"
                      placeholder="Enter system message..."
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                    />
                    <button onClick={handleBroadcast}>
                      <Send size={16} /> Send
                    </button>
                  </div>
                </div>

                <button className="admin-refresh" onClick={fetchStats}>
                  Refresh Stats
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
