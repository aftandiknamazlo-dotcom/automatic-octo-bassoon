import { describe, it, expect } from 'vitest';
import { PLAYER_COLORS, PLAYER_GRADIENTS, BET_PRESETS, BOT_NAMES } from '../types';

describe('Game Constants', () => {
  describe('PLAYER_COLORS', () => {
    it('should have at least 10 colors', () => {
      expect(PLAYER_COLORS.length).toBeGreaterThanOrEqual(10);
    });

    it('should be valid hex colors', () => {
      PLAYER_COLORS.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('PLAYER_GRADIENTS', () => {
    it('should have matching length with PLAYER_COLORS', () => {
      expect(PLAYER_GRADIENTS.length).toBe(PLAYER_COLORS.length);
    });

    it('should have valid gradient pairs', () => {
      PLAYER_GRADIENTS.forEach(([start, end]) => {
        expect(start).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(end).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('BET_PRESETS', () => {
    it('should have preset values', () => {
      expect(BET_PRESETS).toEqual([1, 5, 10, 25, 50, 100]);
    });

    it('should be sorted ascending', () => {
      const sorted = [...BET_PRESETS].sort((a, b) => a - b);
      expect(BET_PRESETS).toEqual(sorted);
    });
  });

  describe('BOT_NAMES', () => {
    it('should have unique names', () => {
      const uniqueNames = new Set(BOT_NAMES);
      expect(uniqueNames.size).toBe(BOT_NAMES.length);
    });

    it('should have at least 30 bot names', () => {
      expect(BOT_NAMES.length).toBeGreaterThanOrEqual(30);
    });
  });
});
