// ===== SPINX Provably Fair System =====
// Uses Web Crypto API for secure hashing

export interface RoundSeed {
  serverSeed: string;
  serverSeedHash: string; // shown BEFORE the round
  clientSeed: string;
  nonce: number;
  roll: number; // 0..1 derived deterministically
}

// Generate cryptographically secure random hex string
function getSecureRandomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// SHA-256 hash using Web Crypto API
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// HMAC-SHA256 for combining seeds
async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const msgData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a new round seed
export async function generateRoundSeed(nonce: number): Promise<RoundSeed> {
  const serverSeed = getSecureRandomHex(32); // 64 hex chars
  const clientSeed = getSecureRandomHex(16); // 32 hex chars
  const serverSeedHash = await sha256(serverSeed);

  // Derive roll from HMAC(serverSeed, clientSeed:nonce)
  const combined = `${clientSeed}:${nonce}`;
  const hmac = await hmacSha256(serverSeed, combined);

  // Take first 8 hex chars (32 bits) and convert to float [0, 1)
  const int = parseInt(hmac.substring(0, 8), 16);
  const roll = int / 0x100000000; // divide by 2^32

  return {
    serverSeed,
    serverSeedHash,
    clientSeed,
    nonce,
    roll,
  };
}

// Verify a round result (after server seed is revealed)
export async function verifyRound(seed: RoundSeed): Promise<boolean> {
  // 1. Verify server seed matches its hash
  const computedHash = await sha256(seed.serverSeed);
  if (computedHash !== seed.serverSeedHash) return false;

  // 2. Re-derive the roll
  const combined = `${seed.clientSeed}:${seed.nonce}`;
  const hmac = await hmacSha256(seed.serverSeed, combined);
  const int = parseInt(hmac.substring(0, 8), 16);
  const expectedRoll = int / 0x100000000;

  // 3. Compare
  return Math.abs(expectedRoll - seed.roll) < 0.0001;
}

// Independent roll calculator for the Verifier UI
export async function calculateRoll(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<number> {
  const combined = `${clientSeed}:${nonce}`;
  const hmac = await hmacSha256(serverSeed, combined);
  
  // Convert first 8 hex chars to floating point [0, 1)
  const int = parseInt(hmac.substring(0, 8), 16);
  const rollFraction = int / 0x100000000;
  
  // Return result as percentage 0-100 formatted to 2 decimals
  return Math.floor(rollFraction * 10000) / 100;
}

// Validate bet input for security
export function validateBetAmount(
  amount: number,
  balance: number,
  minBet: number = 0.01,
  maxBet: number = 10000
): { valid: boolean; error?: string } {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Некорректная сумма' };
  }
  if (amount < minBet) {
    return { valid: false, error: `Минимальная ставка: $${minBet}` };
  }
  if (amount > maxBet) {
    return { valid: false, error: `Максимальная ставка: $${maxBet}` };
  }
  if (amount > balance) {
    return { valid: false, error: 'Недостаточно средств' };
  }
  // Prevent floating point exploits - max 2 decimal places
  if (Math.round(amount * 100) / 100 !== amount) {
    return { valid: false, error: 'Максимум 2 знака после запятой' };
  }
  return { valid: true };
}
