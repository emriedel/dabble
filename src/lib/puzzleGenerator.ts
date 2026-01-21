import seedrandom from 'seedrandom';
import {
  BOARD_SIZE,
  BOARD_CONFIG,
  LETTER_DISTRIBUTION,
  VOWELS,
  LETTER_CONSTRAINTS,
  COMMON_2_LETTER_WORDS,
  COMMON_3_LETTER_WORDS,
  BOARD_SYMMETRY,
  BONUS_PLACEMENT,
} from '@/constants/gameConfig';
import type { GameBoard, Cell, BonusType, DailyPuzzle } from '@/types';

// Create a seeded random number generator for a given date
function createRng(dateString: string): () => number {
  return seedrandom(dateString);
}

// Generate a random integer in range [min, max]
function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// Shuffle an array using Fisher-Yates
function shuffle<T>(rng: () => number, array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Check if a cell position is within bounds
function inBounds(row: number, col: number, size: number): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

// Get neighboring cells
function getNeighbors(row: number, col: number, size: number): [number, number][] {
  const neighbors: [number, number][] = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of directions) {
    const nr = row + dr;
    const nc = col + dc;
    if (inBounds(nr, nc, size)) {
      neighbors.push([nr, nc]);
    }
  }
  return neighbors;
}

// Get the 180° rotated position of a cell
function getRotatedPosition(r: number, c: number, size: number): [number, number] {
  return [size - 1 - r, size - 1 - c];
}

// Check if a cell is in the "first half" (for 180° symmetry, only generate in upper-left)
function isInFirstHalf(r: number, c: number, size: number): boolean {
  const center = Math.floor(size / 2);
  // Consider cells where r < center, or r == center and c < center
  return r < center || (r === center && c < center);
}

// Generate the board shape with 180° rotational symmetry
function generateBoardShape(rng: () => number, size: number): boolean[][] {
  const playable: boolean[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(true));

  const totalCells = size * size;
  const targetPlayable = randInt(
    rng,
    Math.floor(totalCells * BOARD_CONFIG.minPlayablePercent),
    Math.floor(totalCells * BOARD_CONFIG.maxPlayablePercent)
  );
  const targetDead = totalCells - targetPlayable;

  const centerR = Math.floor(size / 2);
  const centerC = Math.floor(size / 2);
  const protectionRadius = BOARD_SYMMETRY.centerProtectionRadius;

  // Manhattan distance from center
  const distFromCenter = (r: number, c: number) =>
    Math.abs(r - centerR) + Math.abs(c - centerC);

  // Collect potential dead space seed points (only in first half for symmetry)
  const seedPoints: [number, number][] = [];

  // Corners (only upper-left quadrant corners)
  if (rng() < 0.8) seedPoints.push([0, 0]);
  if (rng() < 0.6) seedPoints.push([0, size - 1]);
  if (rng() < 0.6) seedPoints.push([size - 1, 0]);

  // Edge points in first half
  for (let i = 1; i < size - 1; i++) {
    if (isInFirstHalf(0, i, size) && rng() < 0.25) seedPoints.push([0, i]);
    if (isInFirstHalf(i, 0, size) && rng() < 0.25) seedPoints.push([i, 0]);
    if (isInFirstHalf(size - 1, i, size) && rng() < 0.25) seedPoints.push([size - 1, i]);
    if (isInFirstHalf(i, size - 1, size) && rng() < 0.25) seedPoints.push([i, size - 1]);
  }

  const shuffledSeeds = shuffle(rng, seedPoints);
  let deadCount = 0;

  // Grow dead spaces from seed points, always applying symmetry
  for (const [sr, sc] of shuffledSeeds) {
    if (deadCount >= targetDead / 2) break; // Half the target since we mirror

    // Skip if in protected center area
    if (distFromCenter(sr, sc) < protectionRadius) continue;
    if (!playable[sr][sc]) continue;

    // BFS to grow a small cluster (1-3 cells)
    const clusterSize = randInt(rng, 1, 3);
    const cluster: [number, number][] = [[sr, sc]];
    const visited = new Set<string>();
    visited.add(`${sr},${sc}`);

    const queue: [number, number][] = [[sr, sc]];

    while (queue.length > 0 && cluster.length < clusterSize) {
      const [r, c] = queue.shift()!;

      for (const [nr, nc] of getNeighbors(r, c, size)) {
        const key = `${nr},${nc}`;
        if (visited.has(key)) continue;
        visited.add(key);

        // Skip protected center area
        if (distFromCenter(nr, nc) < protectionRadius) continue;
        if (!playable[nr][nc]) continue;
        // Only add cells in first half (symmetry maintained via mirroring later)
        if (!isInFirstHalf(nr, nc, size) && !(nr === centerR && nc === centerC)) continue;

        if (rng() < 0.4) {
          cluster.push([nr, nc]);
          queue.push([nr, nc]);
        }
      }
    }

    // Apply cluster and its symmetric mirror
    for (const [r, c] of cluster) {
      if (distFromCenter(r, c) >= protectionRadius && playable[r][c]) {
        playable[r][c] = false;
        deadCount++;

        // Mirror to 180° rotated position
        const [mr, mc] = getRotatedPosition(r, c, size);
        if (mr !== r || mc !== c) { // Don't double-count center
          if (playable[mr][mc] && distFromCenter(mr, mc) >= protectionRadius) {
            playable[mr][mc] = false;
            deadCount++;
          }
        }
      }
    }
  }

  // Ensure the board is connected (all playable cells reachable from center)
  const visited: boolean[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(false));

  const reachQueue: [number, number][] = [[centerR, centerC]];
  visited[centerR][centerC] = true;

  while (reachQueue.length > 0) {
    const [r, c] = reachQueue.shift()!;
    for (const [nr, nc] of getNeighbors(r, c, size)) {
      if (playable[nr][nc] && !visited[nr][nc]) {
        visited[nr][nc] = true;
        reachQueue.push([nr, nc]);
      }
    }
  }

  // Mark unreachable playable cells as dead (and their symmetric counterparts)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (playable[r][c] && !visited[r][c]) {
        playable[r][c] = false;
        const [mr, mc] = getRotatedPosition(r, c, size);
        if (mr !== r || mc !== c) {
          playable[mr][mc] = false;
        }
      }
    }
  }

  return playable;
}

// Calculate edge distance (how close to the edge of playable area)
function getEdgeDistance(r: number, c: number, size: number): number {
  const distTop = r;
  const distBottom = size - 1 - r;
  const distLeft = c;
  const distRight = size - 1 - c;
  return Math.min(distTop, distBottom, distLeft, distRight);
}

// Check if any adjacent cell has a bonus
function hasAdjacentBonus(r: number, c: number, bonuses: BonusType[][], size: number): boolean {
  for (const [nr, nc] of getNeighbors(r, c, size)) {
    if (bonuses[nr][nc] !== null) return true;
  }
  return false;
}

// Score a position for bonus placement based on preferences
function scorePosition(
  r: number,
  c: number,
  size: number,
  centerR: number,
  centerC: number,
  edgePreference: number
): number {
  const edgeDist = getEdgeDistance(r, c, size);
  const maxEdgeDist = Math.floor(size / 2);

  // Score based on edge preference (higher edgePreference = prefer edges)
  // edgeDist 0 = on edge, edgeDist max = near center
  const normalizedEdge = 1 - edgeDist / maxEdgeDist;
  return normalizedEdge * edgePreference + (1 - normalizedEdge) * (1 - edgePreference);
}

// Place bonus squares on the board with strategic placement and symmetry
function placeBonuses(
  rng: () => number,
  playable: boolean[][],
  size: number
): BonusType[][] {
  const bonuses: BonusType[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));

  const centerR = Math.floor(size / 2);
  const centerC = Math.floor(size / 2);

  // Place start square in center
  bonuses[centerR][centerC] = 'START';

  // Manhattan distance from center
  const distFromCenter = (r: number, c: number) =>
    Math.abs(r - centerR) + Math.abs(c - centerC);

  // Get valid positions for bonus placement (only first half for symmetry)
  const getValidPositions = (bonusType: keyof typeof BONUS_PLACEMENT): [number, number][] => {
    const config = BONUS_PLACEMENT[bonusType];
    const positions: [number, number][] = [];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip non-playable, center, or already assigned
        if (!playable[r][c]) continue;
        if (r === centerR && c === centerC) continue;
        if (bonuses[r][c] !== null) continue;

        // Only consider first half for symmetric placement
        if (!isInFirstHalf(r, c, size)) continue;

        // Check minimum distance from center
        if (distFromCenter(r, c) < config.minDistFromCenter) continue;

        // Check adjacent bonus constraint
        if (!config.allowAdjacent && hasAdjacentBonus(r, c, bonuses, size)) continue;

        // Also check that the mirrored position is valid
        const [mr, mc] = getRotatedPosition(r, c, size);
        if (!playable[mr][mc]) continue;
        if (bonuses[mr][mc] !== null) continue;
        if (!config.allowAdjacent && hasAdjacentBonus(mr, mc, bonuses, size)) continue;

        positions.push([r, c]);
      }
    }

    return positions;
  };

  // Place bonuses in order: TW → DW → TL → DL (rarest first)
  const bonusTypes: (keyof typeof BONUS_PLACEMENT)[] = ['TW', 'DW', 'TL', 'DL'];

  for (const bonusType of bonusTypes) {
    const config = BONUS_PLACEMENT[bonusType];
    const count = BOARD_CONFIG.bonusCounts[bonusType];
    // We place in pairs (symmetric), so we need count/2 positions
    const pairsNeeded = Math.ceil(count / 2);

    for (let i = 0; i < pairsNeeded; i++) {
      const validPositions = getValidPositions(bonusType);
      if (validPositions.length === 0) break;

      // Score positions and select based on preference
      const scoredPositions = validPositions.map(([r, c]) => ({
        pos: [r, c] as [number, number],
        score: scorePosition(r, c, size, centerR, centerC, config.edgePreference),
      }));

      // Sort by score (descending) and add some randomness
      scoredPositions.sort((a, b) => b.score - a.score);

      // Pick from top candidates with weighted random selection
      const topN = Math.min(5, scoredPositions.length);
      const weights = scoredPositions.slice(0, topN).map((p, idx) => Math.pow(0.6, idx));
      const totalWeight = weights.reduce((a, b) => a + b, 0);

      let pick = rng() * totalWeight;
      let selectedIdx = 0;
      for (let j = 0; j < weights.length; j++) {
        pick -= weights[j];
        if (pick <= 0) {
          selectedIdx = j;
          break;
        }
      }

      const [r, c] = scoredPositions[selectedIdx].pos;
      bonuses[r][c] = bonusType;

      // Place symmetric counterpart
      const [mr, mc] = getRotatedPosition(r, c, size);
      if (mr !== r || mc !== c) {
        bonuses[mr][mc] = bonusType;
      }
    }
  }

  return bonuses;
}

// Sort letters: vowels first (alphabetically), then consonants (alphabetically)
function sortLetters(letters: string[]): string[] {
  const vowels = letters.filter((l) => VOWELS.includes(l)).sort();
  const consonants = letters.filter((l) => !VOWELS.includes(l)).sort();
  return [...vowels, ...consonants];
}

// Check if a set of letters can form a given word
function canFormWord(letters: string[], word: string): boolean {
  const available = [...letters];
  for (const char of word) {
    const idx = available.indexOf(char);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

// Count how many words from a list can be formed with given letters
function countFormableWords(letters: string[], wordList: string[]): number {
  return wordList.filter(word => canFormWord(letters, word)).length;
}

// Check if letters meet playability requirements
function isPlayable(letters: string[]): boolean {
  const twoLetterCount = countFormableWords(letters, COMMON_2_LETTER_WORDS);
  const threeLetterCount = countFormableWords(letters, COMMON_3_LETTER_WORDS);
  return twoLetterCount >= 3 && threeLetterCount >= 2;
}

// Check if letters meet all constraints
function meetsConstraints(letters: string[]): boolean {
  const { minVowels, maxVowels, minUniqueLetters, maxDuplicatesPerLetter, totalLetters } = LETTER_CONSTRAINTS;

  if (letters.length !== totalLetters) return false;

  // Check vowel count
  const vowelCount = letters.filter(l => VOWELS.includes(l)).length;
  if (vowelCount < minVowels || vowelCount > maxVowels) return false;

  // Check unique letters
  const uniqueLetters = new Set(letters);
  if (uniqueLetters.size < minUniqueLetters) return false;

  // Check max duplicates per letter
  const letterCounts = new Map<string, number>();
  for (const letter of letters) {
    const count = (letterCounts.get(letter) || 0) + 1;
    if (count > maxDuplicatesPerLetter) return false;
    letterCounts.set(letter, count);
  }

  return true;
}

// Generate the letter set for a puzzle with constraint-based drawing
function generateLetters(rng: () => number): string[] {
  const { totalLetters, minVowels, maxVowels, maxDuplicatesPerLetter } = LETTER_CONSTRAINTS;

  // Create separate vowel and consonant pools
  const vowelPool: string[] = [];
  const consonantPool: string[] = [];

  for (const [letter, count] of Object.entries(LETTER_DISTRIBUTION)) {
    const pool = VOWELS.includes(letter) ? vowelPool : consonantPool;
    for (let i = 0; i < count; i++) {
      pool.push(letter);
    }
  }

  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const shuffledVowels = shuffle(rng, [...vowelPool]);
    const shuffledConsonants = shuffle(rng, [...consonantPool]);

    const drawn: string[] = [];
    const letterCounts = new Map<string, number>();

    // Decide how many vowels (between minVowels and maxVowels)
    const targetVowels = randInt(rng, minVowels, maxVowels);
    const targetConsonants = totalLetters - targetVowels;

    // Draw vowels
    let vowelIdx = 0;
    while (drawn.filter(l => VOWELS.includes(l)).length < targetVowels && vowelIdx < shuffledVowels.length) {
      const letter = shuffledVowels[vowelIdx++];
      const count = letterCounts.get(letter) || 0;
      if (count < maxDuplicatesPerLetter) {
        drawn.push(letter);
        letterCounts.set(letter, count + 1);
      }
    }

    // Draw consonants
    let consonantIdx = 0;
    while (drawn.filter(l => !VOWELS.includes(l)).length < targetConsonants && consonantIdx < shuffledConsonants.length) {
      const letter = shuffledConsonants[consonantIdx++];
      const count = letterCounts.get(letter) || 0;
      if (count < maxDuplicatesPerLetter) {
        drawn.push(letter);
        letterCounts.set(letter, count + 1);
      }
    }

    // Fill any remaining slots if needed
    const allRemaining = shuffle(rng, [...shuffledVowels.slice(vowelIdx), ...shuffledConsonants.slice(consonantIdx)]);
    let remainingIdx = 0;
    while (drawn.length < totalLetters && remainingIdx < allRemaining.length) {
      const letter = allRemaining[remainingIdx++];
      const count = letterCounts.get(letter) || 0;
      if (count < maxDuplicatesPerLetter) {
        drawn.push(letter);
        letterCounts.set(letter, count + 1);
      }
    }

    // Check constraints and playability
    if (meetsConstraints(drawn) && isPlayable(drawn)) {
      return sortLetters(drawn);
    }
  }

  // Fallback: pre-validated letter sets that are known to be playable
  const fallbackSets = [
    ['A', 'E', 'I', 'O', 'U', 'B', 'C', 'D', 'G', 'L', 'N', 'R', 'S', 'T'],
    ['A', 'E', 'I', 'O', 'C', 'D', 'F', 'H', 'L', 'M', 'N', 'R', 'S', 'T'],
    ['A', 'E', 'I', 'U', 'B', 'D', 'G', 'K', 'L', 'N', 'P', 'R', 'S', 'T'],
    ['A', 'E', 'O', 'U', 'C', 'D', 'H', 'L', 'M', 'N', 'P', 'R', 'S', 'W'],
    ['A', 'E', 'I', 'O', 'B', 'D', 'F', 'G', 'L', 'N', 'R', 'S', 'T', 'Y'],
  ];

  const fallbackIdx = Math.floor(rng() * fallbackSets.length);
  return sortLetters(shuffle(rng, fallbackSets[fallbackIdx]));
}

// Generate a complete game board
function generateBoard(rng: () => number): GameBoard {
  const playable = generateBoardShape(rng, BOARD_SIZE);
  const bonuses = placeBonuses(rng, playable, BOARD_SIZE);

  const cells: Cell[][] = Array(BOARD_SIZE)
    .fill(null)
    .map((_, row) =>
      Array(BOARD_SIZE)
        .fill(null)
        .map((_, col) => ({
          row,
          col,
          bonus: bonuses[row][col],
          isPlayable: playable[row][col],
          letter: null,
          isLocked: false,
        }))
    );

  return { cells, size: BOARD_SIZE };
}

// Get today's date string in YYYY-MM-DD format
export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Generate the daily puzzle
export function generateDailyPuzzle(dateString?: string): DailyPuzzle {
  const date = dateString || getTodayDateString();
  const seed = Date.parse(date);
  const rng = createRng(date);

  const board = generateBoard(rng);
  const letters = generateLetters(rng);

  return {
    date,
    board,
    letters,
    seed,
  };
}

// Get puzzle for a specific date (useful for testing)
export function getPuzzleForDate(dateString: string): DailyPuzzle {
  return generateDailyPuzzle(dateString);
}
