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
    <div
      className="grid gap-1 p-2 bg-neutral-800 rounded-lg w-full"
      style={{
        gridTemplateColumns: `repeat(${board.size}, 1fr)`,
        maxWidth: '400px',
      }}
    >
      {board.cells.flat().map((cell) => {
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
          />
        );
      })}
    </div>
  );
}
