// Achievements system
export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  requirement: number;
  type: 'bets' | 'wins' | 'streak' | 'amount';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENTS: Achievement[] = [
  // Common
  { id: 'first_bet', icon: 'Dices', title: 'Первый шаг', description: 'Сделайте первую ставку', requirement: 1, type: 'bets', rarity: 'common' },
  { id: 'first_win', icon: 'Trophy', title: 'Первая победа', description: 'Выиграйте первый раунд', requirement: 1, type: 'wins', rarity: 'common' },
  { id: 'lucky_7', icon: 'Sparkles', title: 'Счастливчик', description: 'Выиграйте с числом 7', requirement: 1, type: 'wins', rarity: 'common' },
  
  // Rare
  { id: 'high_roller', icon: 'Gem', title: 'Хайроллер', description: 'Сделайте ставку от $100', requirement: 100, type: 'amount', rarity: 'rare' },
  { id: 'win_streak_3', icon: 'Flame', title: 'Горячая серия', description: 'Выиграйте 3 раунда подряд', requirement: 3, type: 'streak', rarity: 'rare' },
  { id: 'bets_10', icon: 'TrendingUp', title: 'Активный игрок', description: 'Сделайте 10 ставок', requirement: 10, type: 'bets', rarity: 'rare' },
  { id: 'big_win', icon: 'Coins', title: 'Крупный выигрыш', description: 'Выиграйте $1000+ за раз', requirement: 1000, type: 'amount', rarity: 'rare' },
  
  // Epic
  { id: 'win_streak_5', icon: 'Zap', title: 'Непобедимый', description: 'Выиграйте 5 раундов подряд', requirement: 5, type: 'streak', rarity: 'epic' },
  { id: 'bets_100', icon: 'Target', title: 'Мастер игры', description: 'Сделайте 100 ставок', requirement: 100, type: 'bets', rarity: 'epic' },
  { id: 'whale', icon: 'Waves', title: 'Кит', description: 'Сделайте ставку от $1000', requirement: 1000, type: 'amount', rarity: 'epic' },
  { id: 'jackpot', icon: 'Crown', title: 'Джекпот', description: 'Выиграйте $5000+ за раз', requirement: 5000, type: 'amount', rarity: 'epic' },
  
  // Legendary
  { id: 'legend', icon: 'Star', title: 'Легенда', description: 'Выиграйте 20 раундов подряд', requirement: 20, type: 'streak', rarity: 'legendary' },
  { id: 'millionaire', icon: 'Banknote', title: 'Миллионер', description: 'Общий выигрыш $100K+', requirement: 100000, type: 'amount', rarity: 'legendary' },
  { id: 'veteran', icon: 'Medal', title: 'Ветеран', description: 'Сделайте 1000 ставок', requirement: 1000, type: 'bets', rarity: 'legendary' },
];

// User progress store
interface UserProgress {
  totalBets: number;
  totalWins: number;
  currentStreak: number;
  maxStreak: number;
  totalWon: number;
  unlockedAchievements: string[];
  lastBetAmount: number;
}

const defaultProgress: UserProgress = {
  totalBets: 0,
  totalWins: 0,
  currentStreak: 0,
  maxStreak: 0,
  totalWon: 0,
  unlockedAchievements: [],
  lastBetAmount: 0,
};

class AchievementsStore {
  private progress: UserProgress = { ...defaultProgress };
  private listeners: Set<(achievements: string[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('achievements_progress');
      if (saved) {
        this.progress = { ...defaultProgress, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('achievements_progress', JSON.stringify(this.progress));
    } catch {
      // Ignore storage errors
    }
  }

  private notifyListeners(newAchievements: string[]) {
    this.listeners.forEach(cb => cb(newAchievements));
  }

  subscribe(callback: (achievements: string[]) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Record a bet
  recordBet(amount: number): string[] {
    this.progress.totalBets++;
    this.progress.lastBetAmount = amount;
    return this.checkAchievements();
  }

  // Record a win
  recordWin(amount: number, roll: number): string[] {
    this.progress.totalWins++;
    this.progress.currentStreak++;
    this.progress.totalWon += amount;
    
    if (this.progress.currentStreak > this.progress.maxStreak) {
      this.progress.maxStreak = this.progress.currentStreak;
    }

    // Check for lucky 7
    const newAchievements: string[] = [];
    
    if (roll >= 0.06 && roll < 0.07 && !this.progress.unlockedAchievements.includes('lucky_7')) {
      newAchievements.push('lucky_7');
    }

    const checked = this.checkAchievements();
    return [...newAchievements, ...checked];
  }

  // Record a loss (resets streak)
  recordLoss() {
    this.progress.currentStreak = 0;
    this.saveToStorage();
  }

  private checkAchievements(): string[] {
    const newAchievements: string[] = [];
    const p = this.progress;

    for (const ach of ACHIEVEMENTS) {
      if (p.unlockedAchievements.includes(ach.id)) continue;

      let unlocked = false;
      switch (ach.type) {
        case 'bets':
          unlocked = p.totalBets >= ach.requirement;
          break;
        case 'wins':
          unlocked = p.totalWins >= ach.requirement;
          break;
        case 'streak':
          unlocked = p.maxStreak >= ach.requirement;
          break;
        case 'amount':
          // Check if last bet or total won meets requirement
          unlocked = p.lastBetAmount >= ach.requirement || p.totalWon >= ach.requirement;
          break;
      }

      if (unlocked) {
        p.unlockedAchievements.push(ach.id);
        newAchievements.push(ach.id);
      }
    }

    if (newAchievements.length > 0) {
      this.saveToStorage();
      this.notifyListeners(newAchievements);
    }

    return newAchievements;
  }

  getProgress(): UserProgress {
    return { ...this.progress };
  }

  getUnlockedAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter(a => this.progress.unlockedAchievements.includes(a.id));
  }

  getLockedAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter(a => !this.progress.unlockedAchievements.includes(a.id));
  }

  isUnlocked(id: string): boolean {
    return this.progress.unlockedAchievements.includes(id);
  }

  getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'common': return '#95a5a6';
      case 'rare': return '#3498db';
      case 'epic': return '#9b59b6';
      case 'legendary': return '#f39c12';
      default: return '#95a5a6';
    }
  }

  reset() {
    this.progress = { ...defaultProgress };
    this.saveToStorage();
  }
}

export const achievementsStore = new AchievementsStore();
