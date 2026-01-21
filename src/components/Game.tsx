'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameBoard } from './GameBoard';
import { LetterRack } from './LetterRack';
import { WordList } from './WordList';
import { ShareModal } from './ShareModal';
import { generateDailyPuzzle, getTodayDateString } from '@/lib/puzzleGenerator';
import { loadDictionary } from '@/lib/dictionary';
import { validatePlacement, applyPlacement } from '@/lib/gameLogic';
import type { DailyPuzzle, GameBoard as GameBoardType, PlacedTile, Word } from '@/types';

// Bonus for using all letters in the puzzle
const ALL_LETTERS_BONUS = 50;

export function Game() {
  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
  const [board, setBoard] = useState<GameBoardType | null>(null);
  const [rackLetters, setRackLetters] = useState<string[]>([]);
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>([]);
  const [usedRackIndices, setUsedRackIndices] = useState<Set<number>>(new Set()); // Currently placed (not yet submitted)
  const [lockedRackIndices, setLockedRackIndices] = useState<Set<number>>(new Set()); // Permanently used (submitted)
  const [selectedRackIndex, setSelectedRackIndex] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [submittedWords, setSubmittedWords] = useState<Word[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  // Initialize game
  useEffect(() => {
    async function init() {
      await loadDictionary();
      const dailyPuzzle = generateDailyPuzzle();
      setPuzzle(dailyPuzzle);
      setBoard(dailyPuzzle.board);
      setRackLetters(dailyPuzzle.letters);
      setIsLoading(false);
    }
    init();
  }, []);

  // Handle rack letter selection
  const handleRackClick = useCallback((index: number) => {
    // Can't select if already used (placed or locked)
    if (usedRackIndices.has(index) || lockedRackIndices.has(index)) return;

    if (selectedRackIndex === index) {
      setSelectedRackIndex(null);
    } else {
      setSelectedRackIndex(index);
    }
    setError(null);
  }, [selectedRackIndex, usedRackIndices, lockedRackIndices]);

  // Handle board cell click
  const handleCellClick = useCallback((row: number, col: number) => {
    if (!board) return;

    const cell = board.cells[row][col];
    if (!cell.isPlayable) return;

    // If cell is locked (has a submitted letter), do nothing
    if (cell.isLocked && cell.letter) return;

    // Check if there's already a placed tile here
    const existingTileIndex = placedTiles.findIndex(
      (t) => t.row === row && t.col === col
    );

    if (existingTileIndex !== -1) {
      // Remove the placed tile and return letter to rack
      const tile = placedTiles[existingTileIndex];
      const rackIndex = Array.from(usedRackIndices).find(
        (idx) => rackLetters[idx] === tile.letter
      );

      setPlacedTiles((prev) => prev.filter((_, i) => i !== existingTileIndex));

      if (rackIndex !== undefined) {
        setUsedRackIndices((prev) => {
          const next = new Set(prev);
          next.delete(rackIndex);
          return next;
        });
      }

      setSelectedCell(null);
      setError(null);
      return;
    }

    // If we have a selected letter, place it
    if (selectedRackIndex !== null) {
      const letter = rackLetters[selectedRackIndex];

      setPlacedTiles((prev) => [...prev, { row, col, letter }]);
      setUsedRackIndices((prev) => new Set([...prev, selectedRackIndex]));
      setSelectedRackIndex(null);
      setSelectedCell(null);
      setError(null);
    } else {
      // Select the cell (for future keyboard input maybe)
      setSelectedCell({ row, col });
    }
  }, [board, placedTiles, selectedRackIndex, rackLetters, usedRackIndices]);

  // Submit current placement
  const handleSubmit = useCallback(() => {
    if (!board || placedTiles.length === 0) {
      setError('Place some tiles first');
      return;
    }

    const isFirstWord = submittedWords.length === 0;
    const result = validatePlacement(board, placedTiles, isFirstWord);

    if (!result.valid) {
      setError(result.error || 'Invalid placement');
      return;
    }

    // Apply the placement to the board
    const newBoard = applyPlacement(board, placedTiles);
    setBoard(newBoard);

    // Lock the used rack indices (permanently consume those letters)
    const newLockedIndices = new Set([...lockedRackIndices, ...usedRackIndices]);
    setLockedRackIndices(newLockedIndices);

    // Check if all letters are now used
    const allLettersUsed = newLockedIndices.size === rackLetters.length;
    const bonus = allLettersUsed ? ALL_LETTERS_BONUS : 0;

    // Update game state
    setSubmittedWords((prev) => [...prev, ...result.words]);
    setTotalScore((prev) => prev + result.totalScore + bonus);
    setPlacedTiles([]);
    setUsedRackIndices(new Set());
    setError(allLettersUsed ? null : null);

    // Show bonus message briefly
    if (allLettersUsed) {
      setError(`All letters used! +${ALL_LETTERS_BONUS} bonus!`);
    } else {
      setError(null);
    }
  }, [board, placedTiles, submittedWords.length, lockedRackIndices, usedRackIndices, rackLetters.length]);

  // Clear current placement
  const handleClear = useCallback(() => {
    setPlacedTiles([]);
    setUsedRackIndices(new Set());
    setSelectedRackIndex(null);
    setSelectedCell(null);
    setError(null);
  }, []);

  // Finish game and show share modal
  const handleFinish = useCallback(() => {
    if (submittedWords.length === 0) {
      setError('Submit at least one word first');
      return;
    }
    setShowShareModal(true);
  }, [submittedWords.length]);

  if (isLoading || !board || !puzzle) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-900">
        <div className="text-white text-lg">Loading puzzle...</div>
      </div>
    );
  }

  const availableLetterCount = rackLetters.length - lockedRackIndices.size - usedRackIndices.size;

  return (
    <div className="flex flex-col min-h-screen bg-neutral-900 text-white">
      <div className="flex flex-col flex-1 w-full max-w-md mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-neutral-800">
          <h1 className="text-xl font-bold tracking-tight">Dabble</h1>
          <div className="text-right">
            <div className="text-2xl font-bold text-amber-400">{totalScore}</div>
            <div className="text-xs text-neutral-400">Score</div>
          </div>
        </header>

        {/* Main game area */}
        <main className="flex-1 flex flex-col items-center justify-center gap-4 p-2 overflow-hidden">
        {/* Game Board */}
        <GameBoard
          board={board}
          placedTiles={placedTiles}
          selectedCell={selectedCell}
          onCellClick={handleCellClick}
        />

        {/* Error message */}
        {error && (
          <div className="text-red-400 text-sm font-medium px-4 py-2 bg-red-900/30 rounded">
            {error}
          </div>
        )}

        {/* Letter Rack */}
        <LetterRack
          letters={rackLetters}
          usedIndices={usedRackIndices}
          lockedIndices={lockedRackIndices}
          selectedIndex={selectedRackIndex}
          onLetterClick={handleRackClick}
        />

        {/* Action buttons */}
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={handleClear}
            disabled={placedTiles.length === 0}
            className="flex-1 py-2 px-4 rounded-lg font-semibold text-sm
              bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleSubmit}
            disabled={placedTiles.length === 0}
            className="flex-1 py-2 px-4 rounded-lg font-semibold text-sm
              bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
          >
            Submit Word
          </button>
        </div>

        {/* Status info */}
        <div className="flex gap-4 text-sm text-neutral-400">
          <span>{submittedWords.length} words</span>
          <span>{availableLetterCount} letters left</span>
        </div>
      </main>

        {/* Footer with word list and finish button */}
        <footer className="px-4 pb-4 pt-2">
          <WordList words={submittedWords} />
          {submittedWords.length > 0 && (
            <button
              onClick={handleFinish}
              className="w-full mt-3 py-3 px-4 rounded-lg font-bold text-base
                bg-amber-500 text-neutral-900 hover:bg-amber-400
                transition-colors"
            >
              Finish & Share
            </button>
          )}
        </footer>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          date={puzzle.date}
          words={submittedWords}
          totalScore={totalScore}
          allLettersUsed={lockedRackIndices.size === rackLetters.length}
          allLettersBonus={ALL_LETTERS_BONUS}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
