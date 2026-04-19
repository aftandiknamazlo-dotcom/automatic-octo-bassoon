import { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import type { GameState, GameRound, Player } from '../types';
import { useToast } from '../components/Toast';
import type { ChatMessage } from '../components/Chat';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

// ---- Dev mock gameState (used when server is unreachable) ----
const MOCK_PLAYERS: Player[] = [
  { id: 'p1', name: 'CryptoKing', avatar: '', color: '#6c5ce7', bet: 50, percentage: 50 },
  { id: 'p2', name: 'MoonShot',   avatar: '', color: '#00cec9', bet: 30, percentage: 30 },
  { id: 'p3', name: 'GoldRush',   avatar: '', color: '#fdcb6e', bet: 20, percentage: 20 },
];

const MOCK_GAME_STATE: GameState = {
  phase: 'betting',
  gameId: 1001,
  hash: 'a3f9d8e1b2c4f7a0d5e8b3c6f1a9d2e5b8c1f4a7d0e3b6c9f2a5d8e1b4c7f0',
  serverSeed: '',
  clientSeed: 'dev-client-seed',
  roll: 0,
  timer: 15,
  players: MOCK_PLAYERS,
  totalBank: 100,
  winner: null,
  winAmount: 0,
  commission: 0,
  onlineCount: 42,
  nonce: 1,
};

export function useSocketGame() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<GameRound[]>([]);
  const [hasUserBet, setHasUserBet] = useState(false);
  const [betError, setBetError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null); // New state
  const { addToast } = useToast();

  // Get Telegram initData for authentication
  const getInitData = useCallback(() => {
    try {
      // @ts-expect-error Telegram WebApp types not available
      return window.Telegram?.WebApp?.initData || '';
    } catch {
      return '';
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const initData = getInitData();
    const isDev = import.meta.env.DEV;

    // --- Dev mock: if server unreachable, show demo UI after 1.5s ---
    let mockTimer: ReturnType<typeof setTimeout> | null = null;
    let mockInterval: ReturnType<typeof setInterval> | null = null;
    let mockConnected = false;

    if (isDev) {
      mockTimer = setTimeout(() => {
        // Only activate mock if we haven't connected to the real server
        if (!mockConnected) {
          console.info('[SpinX DEV] Server unreachable — using mock game state');
          setGameState({ ...MOCK_GAME_STATE });
          setBalance(1000);
          // Countdown timer simulation
          let t = 15;
          setTimer(t);
          mockInterval = setInterval(() => {
            t -= 1;
            if (t < 0) t = 15;
            setTimer(t);
          }, 1000);
        }
      }, 1500);
    }

    const socket = io(SOCKET_URL, {
      auth: {
        initData: initData || (isDev ? 'mock_dev_user' : '')
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      mockConnected = true;
      if (mockTimer) clearTimeout(mockTimer);
      if (mockInterval) clearInterval(mockInterval);
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      setConnectionError(err.message);
      setIsConnected(false);
    });

    // Game state updates
    socket.on('game_init', (state: GameState & { history?: GameRound[] }) => {
      setGameState(state);
      setTimer(state.timer || 0);
      if (state.history) setHistory(state.history.slice(0, 20));
      // Reset bet status when round resets to waiting
      if (state.phase === 'waiting') {
        setHasUserBet(false);
      }
    });

    socket.on('timer_sync', (t: number) => {
      setTimer(t);
    });

    socket.on('phase_change', (phase: GameState['phase']) => {
      setGameState(prev => prev ? { ...prev, phase } : prev);
      if (phase === 'betting' || phase === 'waiting') {
        setHasUserBet(false);
      }
    });

    socket.on('bet_update', (data: { players: Player[]; totalBank: number }) => {
      setGameState(prev => prev ? {
        ...prev,
        players: data.players,
        totalBank: data.totalBank
      } : prev);
    });

    socket.on('game_result', (result: {
      winner: Player | null;
      roll: number;
      salt: string;
      winAmount: number;
      commission: number;
    }) => {
      setGameState(prev => prev ? {
        ...prev,
        phase: 'result',
        winner: result.winner,
        winAmount: result.winAmount,
        commission: result.commission,
        serverSeed: result.salt,
        roll: result.roll
      } : prev);

      // Add to history
      setGameState(currentState => {
        const round: GameRound = {
          gameId: currentState?.gameId || 0,
          players: currentState?.players || [],
          totalBank: currentState?.totalBank || 0,
          winner: result.winner,
          winAmount: result.winAmount,
          commission: result.commission,
          roll: result.roll,
          hash: currentState?.hash || '',
          serverSeed: result.salt,
          clientSeed: currentState?.clientSeed || '',
          timestamp: Date.now()
        };
        setHistory(h => [round, ...h].slice(0, 20));
        return currentState;
      });
    });

    socket.on('balance_update', (newBalance: number) => {
      setBalance(newBalance);
    });

    socket.on('user_profile', (profile: any) => {
      setUserProfile(profile);
    });

    socket.on('bet_error', (error: string) => {
      setBetError(error);
      addToast('error', error, 4000);
      setTimeout(() => setBetError(null), 4000);
    });

    socket.on('bet_accepted', (_data: { amount: number }) => {
      // bet was successfully placed, keep hasUserBet = true
    });

    socket.on('bet_refunded', (data: { message: string; amount: number }) => {
      addToast('info', data.message, 6000);
      setBetError(null);
      setHasUserBet(false);
    });

    socket.on('timer_reset', (data: { message: string }) => {
      setBetError(data.message);
      setTimeout(() => setBetError(null), 3000);
    });

    socket.on('referral_notif', (data: { amount: number; from: string }) => {
      addToast('success', `Реферальный бонус: +$${data.amount.toFixed(2)} от ${data.from}`, 5000);
    });

    socket.on('deposit_success', (data: { amount: number }) => {
      addToast('success', `Баланс пополнен на $${data.amount}!`, 5000);
    });

    socket.on('withdrawal_ready', (data: { checkUrl: string; amount: number }) => {
      addToast('success', `Вывод на $${data.amount} выполнен! Заберите ваш чек.`, 10000);
      window.open(data.checkUrl, '_blank');
    });

    // Handle chat messages
    socket.on('chat_message', (msg: ChatMessage) => {
      setChatMessages(prev => [...prev, msg].slice(-100)); // Keep last 100 messages
    });

    // Handle chat errors
    socket.on('chat_error', (data: { message: string; reason: string }) => {
      addToast('error', data.message, 3000);
    });

    // Handle system messages from admin
    socket.on('system_message', (data: { text: string; timestamp: number }) => {
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        playerId: 'system',
        playerName: 'System',
        text: data.text,
        timestamp: data.timestamp,
        isSystem: true
      };
      setChatMessages(prev => [...prev, sysMsg]);
      addToast('info', data.text, 5000);
    });

    socket.on('online_count', (count: number) => {
      setGameState(prev => prev ? { ...prev, onlineCount: count } : prev);
    });

    return () => {
      socket.disconnect();
      if (mockTimer) clearTimeout(mockTimer);
      if (mockInterval) clearInterval(mockInterval);
    };
  }, [getInitData, addToast]);

  // Place bet via socket
  const placeBet = useCallback((amount: number) => {
    if (!socketRef.current?.connected) {
      setBetError('Нет соединения с сервером');
      return;
    }

    if (!gameState || (gameState.phase !== 'betting' && gameState.phase !== 'waiting')) {
      setBetError('Ставки закрыты');
      return;
    }

    socketRef.current.emit('place_bet', { amount });
    setHasUserBet(true);
  }, [gameState]);

  // Continue to next round
  const continueGame = useCallback(() => {
    // Server handles new round automatically
  }, []);

  // Mock deposit for development
  const handleDeposit = useCallback((amount: number) => {
    setBalance(prev => prev + amount);
  }, []);

  // Real withdrawal via API
  const withdraw = useCallback(async (amount: number): Promise<{ success: boolean; checkUrl?: string; error?: string }> => {
    try {
      const initData = getInitData();
      const response = await fetch(`${SOCKET_URL}/api/payments/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tg-init-data': initData
        },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();
      if (data.success) {
        // Balance will be updated via socket balance_update
        return { success: true, checkUrl: data.checkUrl };
      }
      return { success: false, error: data.error };
    } catch (err) {
      console.error('Withdraw call failed:', err);
      return { success: false, error: 'Network error or server unreachable' };
    }
  }, [getInitData]);

  // Show result callback (called after wheel animation)
  const showResult = useCallback(() => {
    // Result is handled by server via socket
  }, []);

  // Send chat message
  const sendMessage = useCallback((text: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('chat_message', { text: text.slice(0, 200) });
  }, []);

  return {
    gameState,
    timer,
    balance,
    hasUserBet,
    history,
    betError,
    isConnected,
    connectionError,
    placeBet,
    showResult,
    continueGame,
    handleDeposit,
    sendMessage,
    chatMessages,
    userProfile,
    withdraw,
  };
}
