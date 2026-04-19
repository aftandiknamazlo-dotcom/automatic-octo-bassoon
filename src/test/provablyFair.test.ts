import { describe, it, expect } from 'vitest';
import { generateRoundSeed, verifyRound, validateBetAmount } from '../provablyFair';

describe('Provably Fair System', () => {
  describe('generateRoundSeed', () => {
    it('should generate valid round seed with all required fields', async () => {
      const seed = await generateRoundSeed(1);
      
      expect(seed).toHaveProperty('serverSeed');
      expect(seed).toHaveProperty('serverSeedHash');
      expect(seed).toHaveProperty('clientSeed');
      expect(seed).toHaveProperty('nonce', 1);
      expect(seed).toHaveProperty('roll');
      
      expect(seed.serverSeed).toHaveLength(64); // 32 bytes hex
      expect(seed.clientSeed).toHaveLength(32);  // 16 bytes hex
      expect(seed.roll).toBeGreaterThanOrEqual(0);
      expect(seed.roll).toBeLessThan(1);
    });

    it('should generate different seeds for different nonces', async () => {
      const seed1 = await generateRoundSeed(1);
      const seed2 = await generateRoundSeed(2);
      
      expect(seed1.serverSeed).not.toBe(seed2.serverSeed);
      expect(seed1.roll).not.toBe(seed2.roll);
    });
  });

  describe('verifyRound', () => {
    it('should verify a valid round seed', async () => {
      const seed = await generateRoundSeed(1);
      const isValid = await verifyRound(seed);
      
      expect(isValid).toBe(true);
    });

    it('should detect tampered server seed', async () => {
      const seed = await generateRoundSeed(1);
      const tamperedSeed = { ...seed, serverSeed: 'tampered' };
      
      const isValid = await verifyRound(tamperedSeed);
      expect(isValid).toBe(false);
    });
  });

  describe('validateBetAmount', () => {
    it('should validate correct amounts', () => {
      const result = validateBetAmount(10, 100);
      expect(result.valid).toBe(true);
    });

    it('should reject amounts below minimum', () => {
      const result = validateBetAmount(0.001, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Минимальная ставка');
    });

    it('should reject amounts above maximum', () => {
      const result = validateBetAmount(20000, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Максимальная ставка');
    });

    it('should reject amounts exceeding balance', () => {
      const result = validateBetAmount(150, 100);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Недостаточно средств');
    });

    it('should reject amounts with more than 2 decimal places', () => {
      const result = validateBetAmount(10.123, 100);
      expect(result.valid).toBe(false);
    });

    it('should reject NaN amounts', () => {
      const result = validateBetAmount(NaN, 100);
      expect(result.valid).toBe(false);
    });
  });
});
