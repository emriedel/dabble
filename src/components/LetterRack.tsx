'use client';

import { RackTile } from './Tile';

interface LetterRackProps {
  letters: string[];
  usedIndices: Set<number>;
  selectedIndex: number | null;
  onLetterClick: (index: number) => void;
}

export function LetterRack({
  letters,
  usedIndices,
  selectedIndex,
  onLetterClick,
}: LetterRackProps) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-center p-3 bg-neutral-800 rounded-lg">
      {letters.map((letter, index) => (
        <RackTile
          key={index}
          letter={letter}
          isSelected={selectedIndex === index}
          isUsed={usedIndices.has(index)}
          onClick={() => onLetterClick(index)}
        />
      ))}
    </div>
  );
}
