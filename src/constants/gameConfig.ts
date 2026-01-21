// Game configuration constants for Dabble
// These can be adjusted to tune gameplay

export const BOARD_SIZE = 9;

// Standard Scrabble letter point values
export const LETTER_POINTS: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4,
  I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3,
  Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8,
  Y: 4, Z: 10,
};

// Letter distribution for the pool (based on Scrabble distribution)
// We'll draw from this pool to create each puzzle's letter set
export const LETTER_DISTRIBUTION: Record<string, number> = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2,
  I: 9, J: 1, K: 1, L: 4, M: 2, N: 6, O: 8, P: 2,
  Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2, W: 2, X: 1,
  Y: 2, Z: 1,
};

// How many letters to give the player each puzzle
export const PUZZLE_LETTER_COUNT = 14;

// Minimum number of vowels to ensure playability
export const MIN_VOWELS = 4;
export const VOWELS = ['A', 'E', 'I', 'O', 'U'];

// Letter constraints for playability
export const LETTER_CONSTRAINTS = {
  totalLetters: 14,
  minVowels: 4,
  maxVowels: 6,
  minUniqueLetters: 10,       // At least 10 different letters
  maxDuplicatesPerLetter: 2,  // No letter more than twice
};

// Common 2-letter words for playability check
export const COMMON_2_LETTER_WORDS = [
  'AN', 'AT', 'BE', 'DO', 'GO', 'HE', 'IF', 'IN', 'IS', 'IT',
  'ME', 'NO', 'OF', 'ON', 'OR', 'SO', 'TO', 'UP', 'WE', 'BY',
  'MY', 'AM', 'AS', 'AH', 'AW', 'OX', 'OH', 'OW', 'US', 'UM',
];

// Common 3-letter words for playability check
export const COMMON_3_LETTER_WORDS = [
  'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'ALL', 'CAN', 'HER', 'WAS',
  'ONE', 'OUT', 'DAY', 'HAD', 'HAS', 'HOW', 'NEW', 'NOW', 'OLD', 'SEE',
  'WAY', 'MAY', 'SAY', 'SHE', 'TWO', 'GET', 'HIM', 'HIS', 'OUR', 'TOO',
  'ANY', 'MAN', 'BIG', 'RUN', 'SET', 'PUT', 'END', 'FAR', 'TOP', 'TEN',
];

// Board generation parameters
export const BOARD_CONFIG = {
  // Percentage of cells that should be playable (not dead spaces)
  minPlayablePercent: 0.65,
  maxPlayablePercent: 0.85,

  // Bonus square counts for a 9x9 board
  bonusCounts: {
    DL: 8,  // Double Letter
    TL: 4,  // Triple Letter
    DW: 4,  // Double Word
    TW: 2,  // Triple Word
  },
};

// Board symmetry configuration
export const BOARD_SYMMETRY = {
  type: '180' as const,       // 180-degree rotational symmetry
  centerProtectionRadius: 2,  // Cells within 2 of center always playable
};

// Bonus placement configuration - strategic placement rules
export const BONUS_PLACEMENT = {
  TW: { edgePreference: 0.9, minDistFromCenter: 3, allowAdjacent: false },
  DW: { edgePreference: 0.6, minDistFromCenter: 2, allowAdjacent: false },
  TL: { edgePreference: 0.4, minDistFromCenter: 1, allowAdjacent: true },
  DL: { edgePreference: 0.3, minDistFromCenter: 0, allowAdjacent: true },
};

// Bonus multipliers
export const BONUS_MULTIPLIERS = {
  DL: { letter: 2, word: 1 },
  TL: { letter: 3, word: 1 },
  DW: { letter: 1, word: 2 },
  TW: { letter: 1, word: 3 },
  START: { letter: 1, word: 2 }, // Start square acts as double word
};

// Visual styling for bonus squares
export const BONUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  DL: { bg: 'bg-sky-600', text: 'text-sky-100', label: 'DL' },
  TL: { bg: 'bg-blue-700', text: 'text-blue-100', label: 'TL' },
  DW: { bg: 'bg-rose-600', text: 'text-rose-100', label: 'DW' },
  TW: { bg: 'bg-orange-600', text: 'text-orange-100', label: 'TW' },
  START: { bg: 'bg-amber-500', text: 'text-amber-900', label: '★' },
};
