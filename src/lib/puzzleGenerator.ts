import seedrandom from 'seedrandom';
import {
  BOARD_SIZE,
  BOARD_CONFIG,
  LETTER_DISTRIBUTION,
  PUZZLE_LETTER_COUNT,
  MIN_VOWELS,
  VOWELS,
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

// Generate the board shape with dead spaces
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

  // Start with all playable, then carve out dead spaces from edges/corners
  let deadCount = 0;

  // Create organic dead space patterns by growing from corners/edges
  const startPoints: [number, number][] = [];

  // Add corners and some edge points as potential dead space seeds
  const corners: [number, number][] = [
    [0, 0], [0, size - 1], [size - 1, 0], [size - 1, size - 1],
  ];

  for (const corner of corners) {
    if (rng() < 0.7) {
      startPoints.push(corner);
    }
  }

  // Add some random edge points
  for (let i = 0; i < size; i++) {
    if (rng() < 0.3) startPoints.push([0, i]);
    if (rng() < 0.3) startPoints.push([size - 1, i]);
    if (rng() < 0.3) startPoints.push([i, 0]);
    if (rng() < 0.3) startPoints.push([i, size - 1]);
  }

  // Grow dead spaces from start points
  const shuffledStarts = shuffle(rng, startPoints);

  for (const [sr, sc] of shuffledStarts) {
    if (deadCount >= targetDead) break;

    // BFS to grow dead region
    const queue: [number, number][] = [[sr, sc]];
    const maxGrowth = randInt(rng, 2, 6);
    let grown = 0;

    while (queue.length > 0 && grown < maxGrowth && deadCount < targetDead) {
      const [r, c] = queue.shift()!;

      if (!playable[r][c]) continue;

      // Don't make center area dead
      const distFromCenter = Math.abs(r - Math.floor(size / 2)) + Math.abs(c - Math.floor(size / 2));
      if (distFromCenter < 2) continue;

      playable[r][c] = false;
      deadCount++;
      grown++;

      // Add neighbors to queue with some probability
      for (const [nr, nc] of getNeighbors(r, c, size)) {
        if (playable[nr][nc] && rng() < 0.5) {
          queue.push([nr, nc]);
        }
      }
    }
  }

  // Ensure the board is connected (all playable cells reachable from center)
  const centerR = Math.floor(size / 2);
  const centerC = Math.floor(size / 2);

  // BFS from center to find all reachable cells
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

  // Mark unreachable playable cells as dead
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (playable[r][c] && !visited[r][c]) {
        playable[r][c] = false;
      }
    }
  }

  return playable;
}

// Place bonus squares on the board
function placeBonuses(
  rng: () => number,
  playable: boolean[][],
  size: number
): BonusType[][] {
  const bonuses: BonusType[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));

  // Place start square in center
  const centerR = Math.floor(size / 2);
  const centerC = Math.floor(size / 2);
  bonuses[centerR][centerC] = 'START';

  // Get all playable positions (excluding center)
  const positions: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (playable[r][c] && !(r === centerR && c === centerC)) {
        positions.push([r, c]);
      }
    }
  }

  const shuffledPositions = shuffle(rng, positions);
  let posIndex = 0;

  // Place bonus squares
  const bonusTypes: BonusType[] = ['TW', 'DW', 'TL', 'DL'];

  for (const bonusType of bonusTypes) {
    const count = BOARD_CONFIG.bonusCounts[bonusType as keyof typeof BOARD_CONFIG.bonusCounts];
    for (let i = 0; i < count && posIndex < shuffledPositions.length; i++) {
      const [r, c] = shuffledPositions[posIndex++];
      bonuses[r][c] = bonusType;
    }
  }

  return bonuses;
}

// Generate the letter set for a puzzle
function generateLetters(rng: () => number): string[] {
  // Create the letter pool
  const pool: string[] = [];
  for (const [letter, count] of Object.entries(LETTER_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      pool.push(letter);
    }
  }

  const shuffledPool = shuffle(rng, pool);
  const letters: string[] = [];

  // First, ensure we have minimum vowels
  let vowelCount = 0;
  for (const letter of shuffledPool) {
    if (letters.length >= PUZZLE_LETTER_COUNT) break;

    if (VOWELS.includes(letter)) {
      if (vowelCount < MIN_VOWELS || rng() < 0.5) {
        letters.push(letter);
        vowelCount++;
      }
    } else if (vowelCount >= MIN_VOWELS || letters.length < PUZZLE_LETTER_COUNT - (MIN_VOWELS - vowelCount)) {
      letters.push(letter);
    }
  }

  // Fill remaining slots if needed
  while (letters.length < PUZZLE_LETTER_COUNT) {
    const idx = Math.floor(rng() * shuffledPool.length);
    letters.push(shuffledPool[idx]);
  }

  return shuffle(rng, letters);
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
