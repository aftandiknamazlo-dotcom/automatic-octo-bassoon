import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  GameState,
  GamePhase,
  Player,
  GameRound,
} from '../types';
import {
  PLAYER_COLORS,
  BOT_NAMES,
  BETTING_DURATION,
} from '../types';
import { generateRoundSeed, validateBetAmount, verifyRound } from '../provablyFair';
import type { RoundSeed } from '../provablyFair';

// Create a random bot player with realistic bet distribution
function createBot(existingIds: Set<string>, existingNames: Set<string>): Player {
  let id: string;
  do {
    id = 'bot_' + Math.random().toString(36).substring(2, 8);
  } while (existingIds.has(id));

  let name: string;
  do {
    name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  } while (existingNames.has(name));

  const avatar = '';

  // More realistic bet distribution - mostly small bets, occasional whales
  const r = Math.random();
  let bet: number;
  if (r < 0.4) bet = parseFloat((Math.random() * 10 + 1).toFixed(2));       // 40% bet $1-$11
  else if (r < 0.7) bet = parseFloat((Math.random() * 20 + 10).toFixed(2)); // 30% bet $10-$30
  else if (r < 0.9) bet = parseFloat((Math.random() * 30 + 20).toFixed(2)); // 20% bet $20-$50
  else bet = parseFloat((Math.random() * 50 + 50).toFixed(2));              // 10% whale $50-$100

  return { id, name, avatar, color: '', bet, percentage: 0 };
}

function recalcPlayers(players: Player[]): Player[] {
  const total = players.reduce((s, p) => s + p.bet, 0);
  // Sort by bet descending for leaderboard
  const sorted = [...players].sort((a, b) => b.bet - a.bet);
  return sorted.map((p, i) => ({
    ...p,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
    percentage: total > 0 ? parseFloat(((p.bet / total) * 100).toFixed(1)) : 0,
  }));
}

const COMMISSION_RATE = 0.05; // 5%
const MAX_PLAYERS = 10;
const RATE_LIMIT_MS = 1000; // Min ms between bets

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'waiting',
    gameId: Math.floor(Math.random() * 10000) + 1000,
    hash: '',
    serverSeed: '',
    clientSeed: '',
    roll: 0,
    timer: BETTING_DURATION,
    players: [],
    totalBank: 0,
    winner: null,
    winAmount: 0,
    commission: 0,
    onlineCount: Math.floor(Math.random() * 40) + 30,
    nonce: 0,
  });

  const [balance, setBalance] = useState(100.00);
  const [hasUserBet, setHasUserBet] = useState(false);
  const [history, setHistory] = useState<GameRound[]>([]);
  const [betError, setBetError] = useState<string | null>(null);
  const [tgUser, setTgUser] = useState<{ name: string; photo?: string }>({ name: 'Вы' });

  // Initialize Telegram User
  useEffect(() => {
    try {
      // @ts-ignore
      const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
      if (user) {
        setTgUser({
          name: user.first_name + (user.last_name ? ` ${user.last_name}` : ''),
          photo: user.photo_url,
        });
      }
    } catch (e) {
      console.warn('Telegram SDK not available');
    }
  }, []);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<GamePhase>('waiting');
  const nonceRef = useRef(0);
  const roundSeedRef = useRef<RoundSeed | null>(null);
  const lastBetTimeRef = useRef(0);
  const botTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const processedResultsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    phaseRef.current = gameState.phase;
  }, [gameState.phase]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    botTimeoutsRef.current.forEach(t => clearTimeout(t));
    botTimeoutsRef.current = [];
  }, []);

  // Start a new betting round with Provably Fair seed
  const startBettingRound = useCallback(async () => {
    clearTimers();
    setHasUserBet(false);
    setBetError(null);

    nonceRef.current += 1;
    const seed = await generateRoundSeed(nonceRef.current);
    roundSeedRef.current = seed;

    const newGameId = Math.floor(Math.random() * 10000) + 1000;

    setGameState({
      phase: 'betting',
      gameId: newGameId,
      hash: seed.serverSeedHash, // Show hash BEFORE round (can't be faked)
      serverSeed: '', // Hidden until round ends
      clientSeed: seed.clientSeed,
      roll: seed.roll,
      timer: BETTING_DURATION,
      players: [],
      totalBank: 0,
      winner: null,
      winAmount: 0,
      commission: 0,
      onlineCount: Math.floor(Math.random() * 40) + 40,
      nonce: nonceRef.current,
    });

    // Countdown timer
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.timer <= 1) return { ...prev, timer: 0 };
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);

    // Simulated bots joining with realistic timing
    const usedIds = new Set<string>();
    const usedNames = new Set<string>();

    const addBot = () => {
      if (phaseRef.current !== 'betting') return;
      setGameState(prev => {
        // Stop bots from joining if bets are locked (last 5 seconds) or phase changed
        if (prev.phase !== 'betting' || prev.players.length >= MAX_PLAYERS || prev.timer <= 5) return prev;
        const bot = createBot(usedIds, usedNames);
        usedIds.add(bot.id);
        usedNames.add(bot.name);
        const newPlayers = recalcPlayers([...prev.players, bot]);
        const newTotal = newPlayers.reduce((s, p) => s + p.bet, 0);
        return {
          ...prev,
          players: newPlayers,
          totalBank: parseFloat(newTotal.toFixed(2)),
        };
      });
    };

    // Add 3-7 bots with staggered, natural timing
    const botCount = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < botCount; i++) {
      // Early bots join faster, later bots trickle in
      const earlyBias = i < 2 ? 0.3 : 0.7;
      const delay = (Math.random() * earlyBias + (i * 0.15)) * (BETTING_DURATION * 1000);
      const clamped = Math.min(delay, (BETTING_DURATION - 2) * 1000);
      const t = setTimeout(addBot, Math.max(clamped, 800));
      botTimeoutsRef.current.push(t);
    }
  }, [clearTimers]);

  // Place user bet with validation and rate limiting
  const placeBet = useCallback((amount: number) => {
    // Rate limiting
    const now = Date.now();
    if (now - lastBetTimeRef.current < RATE_LIMIT_MS) {
      setBetError('Подождите секунду');
      setTimeout(() => setBetError(null), 2000);
      return;
    }

    // Use ref for phase to avoid stale closure
    if (phaseRef.current !== 'betting') return;

    // Sanitize input
    const sanitized = Math.round(amount * 100) / 100;

    // Validate using functional updater to get fresh balance
    const validation = validateBetAmount(sanitized, balance);
    if (!validation.valid) {
      setBetError(validation.error || 'Ошибка');
      setTimeout(() => setBetError(null), 3000);
      return;
    }

    // Check timer via state updater to avoid stale value
    setGameState(prev => {
      if (prev.timer <= 5) {
        setBetError('Ставки закрыты');
        setTimeout(() => setBetError(null), 2000);
        return prev; // No change
      }

      lastBetTimeRef.current = now;
      setBalance(b => parseFloat((b - sanitized).toFixed(2)));
      setHasUserBet(true);
      setBetError(null);

      const existingUser = prev.players.find(p => p.id === 'user');
      let newPlayers: Player[];

      if (existingUser) {
        newPlayers = prev.players.map(p => 
          p.id === 'user' ? { ...p, bet: parseFloat((p.bet + sanitized).toFixed(2)) } : p
        );
      } else {
        const userPlayer: Player = {
          id: 'user',
          name: tgUser.name,
          avatar: tgUser.photo || '',
          color: '',
          bet: sanitized,
          percentage: 0,
        };
        newPlayers = [userPlayer, ...prev.players];
      }

      const recalculated = recalcPlayers(newPlayers);
      const newTotal = recalculated.reduce((s, p) => s + p.bet, 0);
      
      return {
        ...prev,
        players: recalculated,
        totalBank: parseFloat(newTotal.toFixed(2)),
      };
    });
  }, [balance]);

  // Handle deposit
  const handleDeposit = useCallback((amount: number) => {
    setBalance(prev => parseFloat((prev + amount).toFixed(2)));
  }, []);

  // Start spinning
  const startSpin = useCallback(() => {
    clearTimers();
    setGameState(prev => ({
      ...prev,
      phase: 'spinning',
    }));
  }, [clearTimers]);

  // Show result and reveal server seed
  const showResult = useCallback(() => {
    setGameState(prev => {
      let winner: Player | null = null;

      if (prev.players.length > 0) {
        let cumulative = 0;
        const rollPercent = prev.roll * 100;
        for (const p of prev.players) {
          cumulative += p.percentage;
          if (rollPercent <= cumulative) {
            winner = p;
            break;
          }
        }
        if (!winner) winner = prev.players[prev.players.length - 1];
      }

      const commission = parseFloat((prev.totalBank * COMMISSION_RATE).toFixed(2));
      const winAmount = parseFloat((prev.totalBank - commission).toFixed(2));

      // Save to history with revealed server seed
      const round: GameRound = {
        gameId: prev.gameId,
        players: prev.players,
        totalBank: prev.totalBank,
        winner,
        winAmount,
        commission,
        roll: prev.roll,
        hash: prev.hash,
        serverSeed: roundSeedRef.current?.serverSeed || '',
        clientSeed: prev.clientSeed,
        timestamp: Date.now(),
      };

      // Verify the round asynchronously
      if (roundSeedRef.current) {
        verifyRound(roundSeedRef.current).then(verified => {
          setHistory(h => h.map(r =>
            r.gameId === round.gameId ? { ...r, verified } : r
          ));
        });
      }

      setHistory(h => [round, ...h].slice(0, 20)); // Keep last 20 rounds

      return {
        ...prev,
        phase: 'result' as const,
        winner,
        winAmount,
        commission,
        serverSeed: roundSeedRef.current?.serverSeed || '',
      };
    });
  }, []);

  // Handle balance credit for user win once per game
  useEffect(() => {
    if (gameState.phase === 'result' && gameState.winner?.id === 'user') {
      if (!processedResultsRef.current.has(gameState.gameId)) {
        processedResultsRef.current.add(gameState.gameId);
        setBalance(b => parseFloat((b + gameState.winAmount).toFixed(2)));
      }
    }
  }, [gameState.phase, gameState.winner, gameState.gameId, gameState.winAmount]);

  useEffect(() => {
    if (gameState.phase === 'betting' && gameState.timer === 0) {
      if (gameState.players.length >= 2) {
        startSpin();
      } else {
        // Provide feedback that we are waiting for opponents
        setBetError('Нужно минимум 2 игрока');
        setTimeout(() => setBetError(null), 3000);
        startBettingRound();
      }
    }
  }, [gameState.phase, gameState.timer, gameState.players.length, startSpin, startBettingRound]);

  const continueGame = useCallback(() => {
    startBettingRound();
  }, [startBettingRound]);

  // Auto-start
  useEffect(() => {
    const t = setTimeout(() => startBettingRound(), 500);
    return () => {
      clearTimeout(t);
      clearTimers();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    gameState,
    balance,
    hasUserBet,
    history,
    betError,
    placeBet,
    showResult,
    continueGame,
    handleDeposit,
  };
}
