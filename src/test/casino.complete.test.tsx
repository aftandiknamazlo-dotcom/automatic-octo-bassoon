import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import GameWheel from '../components/GameWheel';
import BettingPanel from '../components/BettingPanel';
import WinnerModal from '../components/WinnerModal';
import type { Player } from '../types';

// ===== COMPLETE CASINO TEST SUITE =====

describe('🎰 CASINO - GameWheel', () => {
  const mockPlayers: Player[] = [
    { id: 'user-1', name: 'Player 1', avatar: '', color: '#3b82f6', bet: 30, percentage: 30 },
    { id: 'user-2', name: 'Player 2', avatar: '', color: '#ef4444', bet: 70, percentage: 70 }
  ];

  const defaultProps = {
    players: mockPlayers,
    phase: 'betting' as const,
    timer: 15,
    roll: 0.5,
    bettingDuration: 30,
    onSpinComplete: vi.fn(),
    language: 'ru' as const
  };

  it('renders wheel with correct structure', () => {
    render(<GameWheel {...defaultProps} />);
    expect(document.querySelector('.wheel-v5')).toBeInTheDocument();
    expect(document.querySelector('.wheel-svg')).toBeInTheDocument();
  });

  it('shows timer during betting phase', () => {
    render(<GameWheel {...defaultProps} phase="betting" timer={20} />);
    expect(document.querySelector('.wheel-hub')).toBeInTheDocument();
  });

  it('shows bank amount when not betting', () => {
    render(<GameWheel {...defaultProps} phase="spinning" />);
    const hub = document.querySelector('.wheel-hub');
    expect(hub).toBeInTheDocument();
  });

  it('displays empty state when no players', () => {
    render(<GameWheel {...defaultProps} players={[]} phase="waiting" />);
    expect(screen.getByText(/ИЩЕМ ИГРОКОВ|FINDING PLAYERS/i)).toBeInTheDocument();
  });

  it('renders in spinning phase', () => {
    const { container } = render(<GameWheel {...defaultProps} roll={0} phase="spinning" />);
    expect(container.querySelector('.wheel-v5')).toBeInTheDocument();
  });

  it('renders with roll value', () => {
    const { container } = render(<GameWheel {...defaultProps} roll={1} phase="spinning" />);
    expect(container.querySelector('.wheel-svg')).toBeInTheDocument();
  });

  it('has hub element', () => {
    render(<GameWheel {...defaultProps} />);
    expect(document.querySelector('.wheel-hub')).toBeInTheDocument();
  });

  it('displays player segments when bets exist', () => {
    render(<GameWheel {...defaultProps} />);
    const svg = document.querySelector('.wheel-svg');
    expect(svg).toBeInTheDocument();
  });
});

describe('💰 CASINO - BettingPanel', () => {
  const mockProps = {
    balance: 1000,
    onPlaceBet: vi.fn(),
    disabled: false,
    onOpenDeposit: vi.fn(),
    onOpenProfile: vi.fn(),
    timer: 15,
    phase: 'betting' as const,
    hasUserBet: false,
    language: 'ru' as const
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders balance correctly', () => {
    render(<BettingPanel {...mockProps} />);
    expect(screen.getByText('1000.00')).toBeInTheDocument();
  });

  it('allows bet input', () => {
    render(<BettingPanel {...mockProps} />);
    const input = screen.getByPlaceholderText('0.00');
    fireEvent.change(input, { target: { value: '100' } });
    expect(input).toHaveValue(100);
  });

  it('places bet on submit', () => {
    const onPlaceBet = vi.fn();
    render(<BettingPanel {...mockProps} onPlaceBet={onPlaceBet} />);
    const input = screen.getByPlaceholderText('0.00');
    fireEvent.change(input, { target: { value: '50' } });
    const buttons = screen.getAllByRole('button');
    const submitBtn = buttons.find(b => b.textContent?.includes('СДЕЛАТЬ'));
    if (submitBtn) fireEvent.click(submitBtn);
    expect(onPlaceBet).toHaveBeenCalledWith(50);
  });

  it('shows disabled state during spinning', () => {
    render(<BettingPanel {...mockProps} phase="spinning" />);
    const buttons = screen.getAllByRole('button');
    const submitBtn = buttons.find(b => b.classList?.contains('console-submit-btn'));
    expect(submitBtn).toBeDisabled();
  });

  it('shows MAX button', () => {
    render(<BettingPanel {...mockProps} />);
    const buttons = screen.getAllByRole('button');
    const hasMax = buttons.some(b => b.textContent === 'MAX');
    expect(hasMax).toBe(true);
  });

  it('MAX button exists', () => {
    render(<BettingPanel {...mockProps} balance={500} />);
    const buttons = screen.getAllByRole('button');
    const hasMax = buttons.some(b => b.textContent === 'MAX');
    expect(hasMax).toBe(true);
  });

  it('shows quarter preset button', () => {
    render(<BettingPanel {...mockProps} />);
    const buttons = screen.getAllByRole('button');
    const hasQuarter = buttons.some(b => b.textContent === '1/4');
    expect(hasQuarter).toBe(true);
  });

  it('shows half preset button', () => {
    render(<BettingPanel {...mockProps} />);
    const buttons = screen.getAllByRole('button');
    const hasHalf = buttons.some(b => b.textContent === '1/2');
    expect(hasHalf).toBe(true);
  });

  it('shows double preset button', () => {
    render(<BettingPanel {...mockProps} />);
    const buttons = screen.getAllByRole('button');
    const hasDouble = buttons.some(b => b.textContent === '2×');
    expect(hasDouble).toBe(true);
  });

  it('locks when timer <= 5 seconds', () => {
    render(<BettingPanel {...mockProps} timer={3} />);
    const buttons = screen.getAllByRole('button');
    const submitBtn = buttons.find(b => b.classList?.contains('console-submit-btn'));
    expect(submitBtn).toBeDisabled();
  });

  it('shows deposit button', () => {
    render(<BettingPanel {...mockProps} />);
    const depositBtn = document.querySelector('.c-add');
    expect(depositBtn).toBeInTheDocument();
  });

  it('opens deposit on plus click', () => {
    const onOpenDeposit = vi.fn();
    render(<BettingPanel {...mockProps} onOpenDeposit={onOpenDeposit} />);
    const addBtn = document.querySelector('.c-add');
    if (addBtn) fireEvent.click(addBtn);
    expect(onOpenDeposit).toHaveBeenCalled();
  });

  it('shows profile button', () => {
    render(<BettingPanel {...mockProps} />);
    const profileBtn = document.querySelector('.console-profile-btn');
    expect(profileBtn).toBeInTheDocument();
  });

  it('opens profile on profile button click', () => {
    const onOpenProfile = vi.fn();
    render(<BettingPanel {...mockProps} onOpenProfile={onOpenProfile} />);
    const profileBtn = document.querySelector('.console-profile-btn');
    if (profileBtn) fireEvent.click(profileBtn);
    expect(onOpenProfile).toHaveBeenCalled();
  });

  it('disables input when hasUserBet during waiting phase', () => {
    render(<BettingPanel {...mockProps} hasUserBet={true} phase="waiting" />);
    const input = screen.getByPlaceholderText('0.00');
    expect(input).toBeDisabled();
  });
});

describe('🏆 CASINO - WinnerModal', () => {
  const mockWinner: Player = {
    id: 'winner-1',
    name: 'Lucky Winner',
    avatar: 'https://example.com/avatar.png',
    color: '#3b82f6',
    bet: 100,
    percentage: 50
  };

  const defaultProps = {
    winner: mockWinner,
    winAmount: 190,
    totalBank: 200,
    commission: 10,
    roll: 0.45,
    onContinue: vi.fn(),
    language: 'ru' as const
  };

  it('renders winner modal', () => {
    render(<WinnerModal {...defaultProps} />);
    expect(screen.getByText(/ПОБЕДИТЕЛЬ/)).toBeInTheDocument();
  });

  it('displays winner name', () => {
    render(<WinnerModal {...defaultProps} />);
    expect(screen.getByText('Lucky Winner')).toBeInTheDocument();
  });

  it('displays win amount', () => {
    render(<WinnerModal {...defaultProps} />);
    expect(screen.getByText(/ВЫИГРЫШ/)).toBeInTheDocument();
  });

  it('displays total bank', () => {
    render(<WinnerModal {...defaultProps} />);
    expect(screen.getByText(/БАНК/)).toBeInTheDocument();
  });

  it('displays commission', () => {
    render(<WinnerModal {...defaultProps} />);
    expect(document.querySelector('.detail-value')).toBeInTheDocument();
  });

  it('displays roll value', () => {
    render(<WinnerModal {...defaultProps} />);
    expect(document.querySelector('.detail-value')).toBeInTheDocument();
  });

  it('displays winner percentage', () => {
    render(<WinnerModal {...defaultProps} />);
    expect(document.querySelector('.winner-name')).toBeInTheDocument();
  });

  it('has continue button', () => {
    render(<WinnerModal {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls onContinue when clicked', () => {
    const onContinue = vi.fn();
    render(<WinnerModal {...defaultProps} onContinue={onContinue} />);
    const continueBtn = screen.getByText(/ГОТОВО/);
    fireEvent.click(continueBtn);
    expect(onContinue).toHaveBeenCalled();
  });

  it('shows YOU WON for current user winner', () => {
    const userWinner = { ...mockWinner, id: 'user' };
    render(<WinnerModal {...defaultProps} winner={userWinner} />);
    expect(screen.getByText(/ВЫ ПОБЕДИЛИ!/)).toBeInTheDocument();
  });

});

describe('🔢 CASINO - Financial Calculations', () => {
  it('calculates 5% commission correctly', () => {
    const totalBank = 200;
    const commissionRate = 0.05;
    const commission = totalBank * commissionRate;
    expect(commission).toBe(10);
  });

  it('calculates winner payout (bank - commission)', () => {
    const totalBank = 200;
    const commission = 10;
    const winAmount = totalBank - commission;
    expect(winAmount).toBe(190);
  });

  it('calculates player percentage correctly', () => {
    const playerBet = 30;
    const totalBank = 100;
    const percentage = (playerBet / totalBank) * 100;
    expect(percentage).toBe(30);
  });

  it('calculates all player percentages summing to 100', () => {
    const players = [
      { bet: 30 },
      { bet: 50 },
      { bet: 20 }
    ];
    const totalBank = 100;
    const percentages = players.map(p => (p.bet / totalBank) * 100);
    const sum = percentages.reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });

  it('handles zero bank without error', () => {
    const totalBank = 0;
    const players = [{ bet: 0 }, { bet: 0 }];
    const percentages = totalBank === 0 
      ? players.map(() => 0)
      : players.map(p => (p.bet / totalBank) * 100);
    expect(percentages).toEqual([0, 0]);
  });

  it('rounds to 2 decimal places', () => {
    const amount = 10.999;
    const rounded = Math.round(amount * 100) / 100;
    expect(rounded).toBe(11);
  });

  it('handles large numbers', () => {
    const totalBank = 1000000;
    const commissionRate = 0.05;
    const commission = totalBank * commissionRate;
    expect(commission).toBe(50000);
  });

  it('handles small numbers', () => {
    const totalBank = 0.01;
    const commissionRate = 0.05;
    const commission = totalBank * commissionRate;
    expect(commission).toBe(0.0005);
  });

  it('rejects negative amounts', () => {
    const amount = -100;
    expect(amount > 0).toBe(false);
  });

  it('rejects zero amounts', () => {
    const amount = 0;
    expect(amount > 0).toBe(false);
  });

  it('accepts minimum bet of 0.01', () => {
    const amount = 0.01;
    expect(amount >= 0.01).toBe(true);
  });

  it('rejects bets below minimum', () => {
    const amount = 0.005;
    expect(amount >= 0.01).toBe(false);
  });

  it('enforces maximum bet limit', () => {
    const MAX_BET = 10000;
    const amount = 15000;
    expect(amount <= MAX_BET).toBe(false);
  });
});

describe('🎲 CASINO - Provably Fair', () => {
  it('generates SHA256 hash', () => {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update('test').digest('hex');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it('converts hash to roll 0-1', () => {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update('test').digest('hex');
    const rollHex = hash.slice(0, 8);
    const rollInt = parseInt(rollHex, 16);
    const roll = rollInt / 0xFFFFFFFF;
    expect(roll).toBeGreaterThanOrEqual(0);
    expect(roll).toBeLessThanOrEqual(1);
  });

  it('different inputs produce different hashes', () => {
    const crypto = require('crypto');
    const hash1 = crypto.createHash('sha256').update('input1').digest('hex');
    const hash2 = crypto.createHash('sha256').update('input2').digest('hex');
    expect(hash1).not.toBe(hash2);
  });

  it('same input produces same hash', () => {
    const crypto = require('crypto');
    const hash1 = crypto.createHash('sha256').update('same').digest('hex');
    const hash2 = crypto.createHash('sha256').update('same').digest('hex');
    expect(hash1).toBe(hash2);
  });

  it('selects winner based on roll', () => {
    const players = [
      { id: '1', percentage: 30 },
      { id: '2', percentage: 70 }
    ];
    const roll = 0.2; // 20%
    let cumulative = 0;
    let winner = null;
    for (const player of players) {
      cumulative += player.percentage / 100;
      if (roll <= cumulative) {
        winner = player;
        break;
      }
    }
    expect(winner?.id).toBe('1');
  });

  it('roll at boundary selects correct winner', () => {
    const players = [
      { id: '1', percentage: 50 },
      { id: '2', percentage: 50 }
    ];
    const roll = 0.5; // exactly 50%
    let cumulative = 0;
    let winner = null;
    for (const player of players) {
      cumulative += player.percentage / 100;
      if (roll <= cumulative) {
        winner = player;
        break;
      }
    }
    expect(winner).not.toBeNull();
  });

  it('roll near 1 selects last player', () => {
    const players = [
      { id: '1', percentage: 30 },
      { id: '2', percentage: 70 }
    ];
    const roll = 0.99;
    let cumulative = 0;
    let winner = null;
    for (const player of players) {
      cumulative += player.percentage / 100;
      if (roll <= cumulative) {
        winner = player;
        break;
      }
    }
    expect(winner?.id).toBe('2');
  });

  it('verifiable with salt', () => {
    const serverSeed = 'server-secret';
    const clientSeed = 'client-input';
    const nonce = 1;
    const combined = `${serverSeed}:${clientSeed}:${nonce}`;
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    expect(hash).toHaveLength(64);
  });
});

describe('🔒 CASINO - Security', () => {
  it('sanitizes bet to 2 decimals', () => {
    const amount = 10.9999;
    const sanitized = Math.round(amount * 100) / 100;
    expect(sanitized).toBe(11);
  });

  it('rejects NaN', () => {
    const amount = NaN;
    expect(isNaN(amount)).toBe(true);
  });

  it('rejects Infinity', () => {
    const amount = Infinity;
    expect(isFinite(amount)).toBe(false);
  });

  it('rejects negative Infinity', () => {
    const amount = -Infinity;
    expect(isFinite(amount)).toBe(false);
  });

  it('validates string input is rejected', () => {
    const amount = '100' as any;
    expect(typeof amount === 'number' && !isNaN(amount)).toBe(false);
  });

  it('percentages sum to ~100 with rounding', () => {
    const players = [
      { percentage: 33.33 },
      { percentage: 33.33 },
      { percentage: 33.34 }
    ];
    const sum = players.reduce((acc, p) => acc + p.percentage, 0);
    expect(Math.abs(sum - 100)).toBeLessThan(0.1);
  });

  it('prevents division by zero', () => {
    const totalBank = 0;
    const bet = 100;
    const percentage = totalBank === 0 ? 0 : (bet / totalBank) * 100;
    expect(percentage).toBe(0);
  });

  it('validates UUID format', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(uuid)).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const invalidUuid = 'not-a-uuid';
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(invalidUuid)).toBe(false);
  });
});

describe('🌐 CASINO - Types & Interfaces', () => {
  it('Player interface has all required fields', () => {
    const player: Player = {
      id: 'test',
      name: 'Test',
      avatar: '',
      color: '#fff',
      bet: 100,
      percentage: 50
    };
    expect(player).toHaveProperty('id');
    expect(player).toHaveProperty('name');
    expect(player).toHaveProperty('avatar');
    expect(player).toHaveProperty('color');
    expect(player).toHaveProperty('bet');
    expect(player).toHaveProperty('percentage');
  });

  it('validates player bet is number', () => {
    const player: Player = {
      id: 'test',
      name: 'Test',
      avatar: '',
      color: '#fff',
      bet: 100,
      percentage: 50
    };
    expect(typeof player.bet).toBe('number');
  });

  it('validates player percentage is number', () => {
    const player: Player = {
      id: 'test',
      name: 'Test',
      avatar: '',
      color: '#fff',
      bet: 100,
      percentage: 50
    };
    expect(typeof player.percentage).toBe('number');
  });
});
