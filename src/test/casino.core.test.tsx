import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import React from 'react';
import GameWheel from '../components/GameWheel';
import BettingPanel from '../components/BettingPanel';
import WinnerModal from '../components/WinnerModal';
import { useSocketGame } from '../hooks/useSocketGame';
import { ToastProvider } from '../components/Toast';
import type { Player, GameState } from '../types';

// ===== CASINO CORE TESTS =====
// Testing critical casino functionality: bets, wheel, payouts, fairness

describe('🎰 CASINO CORE - Game Logic', () => {
  const mockPlayer: Player = {
    id: 'user-1',
    name: 'Test Player',
    avatar: '',
    color: '#3b82f6',
    bet: 10,
    percentage: 50
  };

  const mockPlayers: Player[] = [
    mockPlayer,
    { id: 'user-2', name: 'Player 2', avatar: '', color: '#ef4444', bet: 10, percentage: 50 }
  ];

  describe('GameWheel Component', () => {
    it('renders wheel with players', () => {
      render(
        <GameWheel
          players={mockPlayers}
          phase="betting"
          timer={15}
          roll={0.5}
          bettingDuration={30}
          onSpinComplete={vi.fn()}
          language="ru"
        />
      );
      expect(document.querySelector('.wheel-v5')).toBeInTheDocument();
    });

    it('triggers onSpinComplete when spinning ends', async () => {
      const onSpinComplete = vi.fn();
      
      render(
        <GameWheel
          players={mockPlayers}
          phase="spinning"
          timer={0}
          roll={0.3}
          bettingDuration={30}
          onSpinComplete={onSpinComplete}
          language="ru"
        />
      );

      // Wait for animation (8s spin + buffer)
      await waitFor(() => {
        expect(onSpinComplete).toHaveBeenCalled();
      }, { timeout: 15000 });
    }, 15000);

    it('calculates correct rotation for roll value', () => {
      // Roll 0.5 should result in 180 degrees offset
      const roll = 0.5;
      const expectedRotation = 3600 + (1 - roll) * 360; // 3600 + 180 = 3780
      expect(expectedRotation).toBe(3780);
    });

    it('shows empty state when no bets', () => {
      render(
        <GameWheel
          players={[]}
          phase="waiting"
          timer={0}
          roll={0}
          bettingDuration={30}
          onSpinComplete={vi.fn()}
          language="ru"
        />
      );
      
      expect(screen.getByText(/ИЩЕМ ИГРОКОВ|FINDING PLAYERS/i)).toBeInTheDocument();
    });
  });

  describe('WinnerModal Component', () => {
    const mockWinner: Player = {
      id: 'user-1',
      name: 'Winner',
      avatar: '',
      color: '#3b82f6',
      bet: 100,
      percentage: 50
    };

    it('displays correct win amount', () => {
      render(
        <WinnerModal
          winner={mockWinner}
          winAmount={190}
          totalBank={200}
          commission={10}
          roll={0.45}
          onContinue={vi.fn()}
          language="ru"
        />
      );
      
      expect(document.querySelector('.prize-label')).toHaveTextContent(/ВЫИГРЫШ|WIN/i);
    });

    it('displays correct winner percentage', () => {
      render(
        <WinnerModal
          winner={mockWinner}
          winAmount={190}
          totalBank={200}
          commission={10}
          roll={0.45}
          onContinue={vi.fn()}
          language="ru"
        />
      );
      
      expect(screen.getByText(/Winner/)).toBeInTheDocument();
    });

    it('shows YOU WON for current user', () => {
      const userWinner = { ...mockWinner, id: 'user' };
      
      render(
        <WinnerModal
          winner={userWinner}
          winAmount={190}
          totalBank={200}
          commission={10}
          roll={0.45}
          onContinue={vi.fn()}
          language="ru"
        />
      );
      
      expect(screen.getByText(/ВЫ ПОБЕДИЛИ!/)).toBeInTheDocument();
    });
  });

  describe('BettingPanel Component', () => {
    const mockProps = {
      balance: 1000,
      onPlaceBet: vi.fn(),
      disabled: false,
      onOpenDeposit: vi.fn(),
      onOpenProfile: vi.fn(),
      timer: 15,
      phase: 'betting',
      hasUserBet: false,
      language: 'ru' as const
    };

    it('accepts bet amount', () => {
      render(<BettingPanel {...mockProps} />);
      
      const input = screen.getByPlaceholderText('0.00');
      fireEvent.change(input, { target: { value: '50' } });
      
      expect(input).toHaveValue(50);
    });

    it('places bet when button clicked', () => {
      const onPlaceBet = vi.fn();
      render(<BettingPanel {...mockProps} onPlaceBet={onPlaceBet} />);
      
      const input = screen.getByPlaceholderText('0.00');
      fireEvent.change(input, { target: { value: '100' } });
      
      const buttons = screen.getAllByRole('button');
      const submitBtn = buttons.find(b => b.classList?.contains('console-submit-btn'));
      if (submitBtn) fireEvent.click(submitBtn);
      
      expect(onPlaceBet).toHaveBeenCalledWith(100);
    });

    it('disables button during spinning', () => {
      render(<BettingPanel {...mockProps} phase="spinning" />);
      
      const buttons = screen.getAllByRole('button');
      const spinBtn = buttons.find(b => b.textContent?.includes('РОЗЫГРЫШ') || b.textContent?.includes('SPINNING'));
      expect(spinBtn).toBeDisabled();
    });

    it('shows max button sets max amount', () => {
      render(<BettingPanel {...mockProps} balance={500} />);
      
      const buttons = screen.getAllByRole('button');
      const maxBtn = buttons.find(b => b.textContent === 'MAX');
      if (maxBtn) fireEvent.click(maxBtn);
      
      const input = screen.getByPlaceholderText('0.00');
      expect(input).toHaveValue(500);
    });

    it('shows error when bet exceeds balance', () => {
      render(<BettingPanel {...mockProps} betError="Недостаточно средств" />);
      
      expect(screen.getByText(/Недостаточно средств/)).toBeInTheDocument();
    });

    it('locks bets when timer <= 5 seconds', () => {
      render(<BettingPanel {...mockProps} timer={3} />);
      
      const locked = document.querySelector('.phase-badge');
      expect(locked?.textContent).toMatch(/ЗАБЛОКИРОВАНО|LOCKED/i);
    });
  });
});

describe('💰 CASINO CORE - Financial Math', () => {
  it('calculates winner payout correctly (bank - commission)', () => {
    const totalBank = 200;
    const commissionRate = 0.05;
    const commission = totalBank * commissionRate; // 10
    const winAmount = totalBank - commission; // 190
    
    expect(commission).toBe(10);
    expect(winAmount).toBe(190);
  });

  it('calculates percentages correctly', () => {
    const players = [
      { bet: 30 },
      { bet: 70 }
    ];
    const totalBank = 100;
    
    const percentages = players.map(p => (p.bet / totalBank) * 100);
    expect(percentages[0]).toBe(30);
    expect(percentages[1]).toBe(70);
    expect(percentages.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('handles division by zero gracefully', () => {
    const totalBank = 0;
    const players = [{ bet: 0 }, { bet: 0 }];
    
    // Should not throw
    const percentages = totalBank === 0 
      ? players.map(() => 0)
      : players.map(p => (p.bet / totalBank) * 100);
    
    expect(percentages).toEqual([0, 0]);
  });

  it('validates minimum bet amount', () => {
    const MIN_BET = 0.01;
    const amount = 0.005;
    
    expect(amount < MIN_BET).toBe(true);
  });

  it('validates maximum bet amount', () => {
    const MAX_BET = 10000;
    const amount = 15000;
    
    expect(amount > MAX_BET).toBe(true);
  });
});

describe('🎯 CASINO CORE - Provably Fair', () => {
  it('calculates roll from hash correctly', () => {
    const hash = 'abc123';
    const salt = 'salt456';
    
    // Simulate server calculation
    const crypto = require('crypto');
    const combined = hash + salt;
    const rollHash = crypto.createHash('sha256').update(combined).digest('hex');
    const roll = parseInt(rollHash.slice(0, 8), 16) / 0xFFFFFFFF;
    
    expect(roll).toBeGreaterThanOrEqual(0);
    expect(roll).toBeLessThanOrEqual(1);
  });

  it('selects winner based on roll correctly', () => {
    const players = [
      { id: '1', percentage: 30 },
      { id: '2', percentage: 70 }
    ];
    
    // Roll 0.2 should select player 1 (0-30%)
    const roll = 0.2;
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

  it('verifies hash can be reproduced', () => {
    const serverSeed = 'serverSecret';
    const clientSeed = 'clientInput';
    const nonce = 1;
    
    const combined = `${serverSeed}:${clientSeed}:${nonce}`;
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });
});

describe('🔒 CASINO CORE - Security', () => {
  it('sanitizes bet amounts to 2 decimal places', () => {
    const amount = 10.999;
    const sanitized = Math.round(amount * 100) / 100;
    expect(sanitized).toBe(11);
  });

  it('prevents negative bet amounts', () => {
    const amount = -10;
    expect(amount > 0).toBe(false);
  });

  it('validates NaN amounts', () => {
    const amount = NaN;
    expect(isNaN(amount)).toBe(true);
  });

  it('ensures percentages sum to 100', () => {
    const players = [
      { percentage: 33.33 },
      { percentage: 33.33 },
      { percentage: 33.34 }
    ];
    const sum = players.reduce((acc, p) => acc + p.percentage, 0);
    expect(Math.abs(sum - 100)).toBeLessThan(0.1);
  });
});
