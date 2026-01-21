'use client';

import { Tile } from './Tile';
import type { GameBoard as GameBoardType, PlacedTile } from '@/types';

interface GameBoardProps {
  board: GameBoardType;
  placedTiles: PlacedTile[];
  selectedCell: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
}

export function GameBoard({
  board,
  placedTiles,
  selectedCell,
  onCellClick,
}: GameBoardProps) {
  // Create a map of placed tiles for quick lookup
  const placedMap = new Map(
    placedTiles.map((t) => [`${t.row},${t.col}`, t.letter])
  );

  return (
    <div className="flex flex-col gap-0.5 p-2 bg-neutral-800 rounded-lg">
      {board.cells.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-0.5">
          {row.map((cell) => {
            const key = `${cell.row},${cell.col}`;
            const placedLetter = placedMap.get(key);
            const isSelected =
              selectedCell?.row === cell.row && selectedCell?.col === cell.col;

            return (
              <Tile
                key={key}
                letter={placedLetter || cell.letter}
                bonus={cell.bonus}
                isPlayable={cell.isPlayable}
                isSelected={isSelected}
                isPlaced={!!placedLetter}
                isLocked={cell.isLocked}
                onClick={() => onCellClick(cell.row, cell.col)}
                size="sm"
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
