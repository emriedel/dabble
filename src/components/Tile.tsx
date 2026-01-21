'use client';

import { LETTER_POINTS, BONUS_COLORS } from '@/constants/gameConfig';
import type { BonusType } from '@/types';

interface TileProps {
  letter?: string | null;
  bonus?: BonusType;
  isPlayable?: boolean;
  isSelected?: boolean;
  isPlaced?: boolean;
  isLocked?: boolean;
  onClick?: () => void;
}

export function Tile({
  letter,
  bonus,
  isPlayable = true,
  isSelected = false,
  isPlaced = false,
  isLocked = false,
  onClick,
}: TileProps) {
  if (!isPlayable) {
    return (
      <div className="aspect-square w-full bg-neutral-900 rounded-sm" />
    );
  }

  const hasLetter = letter !== null && letter !== undefined;
  const points = hasLetter ? LETTER_POINTS[letter] || 0 : 0;
  const bonusStyle = bonus && BONUS_COLORS[bonus];

  return (
    <button
      onClick={onClick}
      disabled={isLocked && hasLetter}
      className={`
        aspect-square w-full text-sm sm:text-base
        rounded-sm font-bold relative flex items-center justify-center
        transition-all duration-100
        ${
          hasLetter
            ? isLocked
              ? 'bg-amber-100 text-amber-900 cursor-default'
              : isPlaced
              ? 'bg-amber-200 text-amber-900 ring-2 ring-amber-400'
              : 'bg-amber-100 text-amber-900'
            : bonusStyle
            ? `${bonusStyle.bg} ${bonusStyle.text}`
            : 'bg-neutral-700 hover:bg-neutral-600'
        }
        ${isSelected ? 'ring-2 ring-white scale-105' : ''}
        ${!hasLetter && !isLocked ? 'cursor-pointer' : ''}
      `}
    >
      {hasLetter ? (
        <>
          <span>{letter}</span>
          <span className="absolute bottom-0.5 right-0.5 text-[7px] sm:text-[8px] font-normal opacity-70">
            {points}
          </span>
        </>
      ) : (
        bonusStyle && <span className="text-[9px] sm:text-[10px] font-semibold">{bonusStyle.label}</span>
      )}
    </button>
  );
}

interface RackTileProps {
  letter: string;
  isSelected?: boolean;
  isUsed?: boolean;    // Currently placed on board (can be removed)
  isLocked?: boolean;  // Permanently used (cannot be removed)
  onClick?: () => void;
}

export function RackTile({
  letter,
  isSelected = false,
  isUsed = false,
  isLocked = false,
  onClick
}: RackTileProps) {
  const points = LETTER_POINTS[letter] || 0;
  const disabled = isUsed || isLocked;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-11 h-11 rounded-md font-bold text-lg relative flex items-center justify-center
        transition-all duration-100
        ${
          isLocked
            ? 'bg-neutral-900 text-neutral-700 cursor-default opacity-40'
            : isUsed
            ? 'bg-neutral-700 text-neutral-500 cursor-default'
            : isSelected
            ? 'bg-amber-300 text-amber-900 ring-2 ring-white scale-110 -translate-y-1'
            : 'bg-amber-100 text-amber-900 hover:bg-amber-200 active:scale-95'
        }
      `}
    >
      <span>{letter}</span>
      <span className="absolute bottom-0.5 right-1 text-[9px] font-normal opacity-70">
        {points}
      </span>
    </button>
  );
}
