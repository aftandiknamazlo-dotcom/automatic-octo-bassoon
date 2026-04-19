// ===== SPINX Types =====

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: string;
  bet: number;
  percentage: number;
}

export type GamePhase = 'waiting' | 'betting' | 'spinning' | 'result';

export interface GameRound {
  gameId: number;
  players: Player[];
  totalBank: number;
  winner: Player | null;
  winAmount: number;
  commission: number;
  roll: number;
  hash: string;
  serverSeed: string;
  clientSeed: string;
  timestamp: number;
  verified?: boolean;
}

export interface GameState {
  phase: GamePhase;
  gameId: number;
  hash: string;
  serverSeed: string;
  clientSeed: string;
  roll: number;
  timer: number;
  players: Player[];
  totalBank: number;
  winner: Player | null;
  winAmount: number;
  commission: number;
  onlineCount: number;
  nonce: number;
}

export const PLAYER_COLORS = [
  '#6c5ce7', // violet
  '#00cec9', // teal
  '#fdcb6e', // gold
  '#ff6b6b', // red
  '#00b894', // green
  '#e17055', // coral
  '#74b9ff', // sky
  '#fd79a8', // pink
  '#a29bfe', // lavender
  '#55efc4', // mint
];

export const PLAYER_GRADIENTS: [string, string][] = [
  ['#6c5ce7', '#a29bfe'], // violet
  ['#00cec9', '#55efc4'], // teal
  ['#f9ca24', '#fdcb6e'], // gold
  ['#ff6b6b', '#fc5c65'], // red
  ['#00b894', '#55efc4'], // green
  ['#e17055', '#fab1a0'], // coral
  ['#0984e3', '#74b9ff'], // sky
  ['#fd79a8', '#e84393'], // pink
  ['#6c5ce7', '#a29bfe'], // lavender
  ['#00cec9', '#81ecec'], // mint
];

export const BETTING_DURATION = 20; // seconds — synced with server

export const BET_PRESETS = [1, 5, 10, 25, 50, 100];

export const BOT_NAMES = [
  'CryptoKing', 'Phantom', 'LuckyDraw', 'MoonShot', 'DiamondH',
  'WhaleBet', 'NightOwl', 'StormRider', 'IceBreaker', 'TurboMax',
  'ShadowFox', 'GoldRush', 'PixelPunk', 'CyberWolf', 'NeonBlade',
  'StarBurst', 'BlitzKrieg', 'VoidRunner', 'ZeroGrav', 'ThunderX',
  'AceHigh', 'RocketFuel', 'CosmicRay', 'DarkMatter', 'QuantumBet',
  'AlphaBit', 'Satoshi', 'BullRun', 'EtherScan', 'BlockLord',
  'DefiNinja', 'MetaWhale', 'AltCoiner', 'GasLimit', 'PrivateKey',
];
