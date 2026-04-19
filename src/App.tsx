import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSocketGame } from './hooks/useSocketGame';
import Header from './components/Header';
import type { Language } from './i18n/translations';
import type { Player } from './types';
import GameWheel from './components/GameWheel';
import BettingPanel from './components/BettingPanel';
import PlayersList from './components/PlayersList';
import WinnerModal from './components/WinnerModal';
import ProfileModal from './components/ProfileModal';
import DepositModal from './components/DepositModal';
import HistoryModal from './components/HistoryModal';
import ProvablyFairModal from './components/ProvablyFairModal';
import WithdrawModal from './components/WithdrawModal';
import Chat from './components/Chat';
import AdminPanel from './components/AdminPanel';
import Achievements from './components/Achievements';
import AchievementPopup from './components/AchievementPopup';

import './App.css';

const BETTING_DURATION = 15;

const App: React.FC = () => {
  const {
    gameState,
    timer,
    balance,
    userProfile,
    placeBet,
    sendMessage,
    chatMessages,
    betError,
    hasUserBet,
    history,
    withdraw,
  } = useSocketGame();
  
  const user = {
    id: userProfile?.id || 'user',
    name: userProfile?.name || "Player",
    avatar: userProfile?.avatar || "",
    balance: balance,
    referralEarnings: userProfile?.referralEarnings || 0,
    referredCount: userProfile?.referredCount || 0
  };

  // Modal States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isFairOpen, setIsFairOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('spinx_lang') as Language) || 'ru'
  );

  useEffect(() => {
    localStorage.setItem('spinx_lang', language);
  }, [language]);

  const [showWinner, setShowWinner] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<Player | null>(null);

  const handleSpinComplete = useCallback(() => {
    if (gameState?.winner) {
      setCurrentWinner(gameState.winner);
      setShowWinner(true);
    }
  }, [gameState?.winner]);

  // Handle auto-closing winner modal
  useEffect(() => {
    if (showWinner) {
      const timer = setTimeout(() => setShowWinner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showWinner]);

  if (!gameState) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <span>{language === 'ru' ? 'ИНИЦИАЛИЗАЦИЯ SPINX...' : 'INITIALIZING SPINX...'}</span>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-container">
        
        <Header 
          onlineCount={gameState.onlineCount || gameState.players.length + 5} 
          userName={user.name} 
          userAvatar={user.avatar}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenHash={() => setIsFairOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          serverSeedHash={gameState.hash || ""}
          language={language}
          onLanguageChange={setLanguage}
        />

        <main className="app-main">
          <div className="game-section">
            <GameWheel
              players={gameState.players}
              phase={gameState.phase}
              timer={timer}
              roll={gameState.roll}
              bettingDuration={BETTING_DURATION}
              onSpinComplete={handleSpinComplete}
              language={language}
            />
          </div>

          <div className="feed-section">
            <PlayersList 
              players={gameState.players} 
              totalBank={gameState.totalBank} 
              language={language}
            />
          </div>
        </main>

        <footer className="app-footer-elite">
          <BettingPanel
            balance={balance}
            onPlaceBet={placeBet}
            disabled={gameState.phase === 'spinning' || gameState.phase === 'result'}
            betError={betError}
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            timer={timer}
            phase={gameState.phase}
            hasUserBet={hasUserBet}
            language={language}
          />
        </footer>

        <Chat 
          messages={chatMessages} 
          onSendMessage={sendMessage} 
          isOpen={isChatOpen} 
          onToggle={() => setIsChatOpen(!isChatOpen)} 
          onlineCount={gameState.onlineCount} 
        />
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showWinner && currentWinner && (
          <WinnerModal 
            winner={currentWinner} 
            winAmount={gameState.winAmount}
            totalBank={gameState.totalBank}
            commission={gameState.commission}
            roll={gameState.roll}
            onContinue={() => setShowWinner(false)} 
            language={language}
          />
        )}
        {isProfileOpen && (
          <ProfileModal 
            isOpen={isProfileOpen} 
            onClose={() => setIsProfileOpen(false)} 
            user={{ 
              ...user,
              balance: balance
            }}
            onOpenWithdraw={() => { setIsProfileOpen(false); setIsWithdrawOpen(true); }}
            onOpenDeposit={() => { setIsProfileOpen(false); setIsDepositOpen(true); }}
            language={language}
            onLanguageChange={setLanguage}
          />
        )}
        {isDepositOpen && (
          <DepositModal 
            isOpen={isDepositOpen} 
            onClose={() => setIsDepositOpen(false)} 
            onDeposit={() => {}}
          />
        )}
        {isWithdrawOpen && (
          <WithdrawModal 
            isOpen={isWithdrawOpen} 
            onClose={() => setIsWithdrawOpen(false)} 
            balance={balance} 
            onWithdraw={async (amount) => {
              const res = await withdraw(amount);
              return res.success;
            }}
          />
        )}
        {isHistoryOpen && (
          <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} />
        )}
        {isFairOpen && (
          <ProvablyFairModal 
            isOpen={isFairOpen} 
            onClose={() => setIsFairOpen(false)} 
            serverSeedHash={gameState.hash || ""}
          />
        )}
        {isAchievementsOpen && (
          <Achievements isOpen={isAchievementsOpen} onClose={() => setIsAchievementsOpen(false)} />
        )}
        {isAdminOpen && (
          <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
        )}
      </AnimatePresence>

      <AchievementPopup achievement={null} onClose={() => {}} />
    </div>
  );
};

export default App;
