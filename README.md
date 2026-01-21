# Lexicon

A daily Scrabble-style word puzzle game. Every day, all players receive the same board and letters. Score as high as you can!

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Daily Puzzles**: Same puzzle for everyone each day, changes at midnight
- **Unique Boards**: Randomly-shaped boards with dead spaces and bonus squares
- **Scrabble Scoring**: Standard letter values and bonus multipliers (DL, TL, DW, TW)
- **Word Validation**: 173k+ word dictionary
- **Share Results**: Share your score with friends (emoji grid format)
- **Mobile-First**: Optimized for phones, works great on desktop too

## How to Play

1. **Select a letter** from your rack by tapping it
2. **Place it on the board** by tapping an empty cell
3. **Form words** horizontally or vertically
4. **First word** must cover the center star (★)
5. **Subsequent words** must connect to existing words
6. Tap **Submit Word** to lock in your word and score points
7. When done, tap **Finish & Share** to see your results

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Randomization**: seedrandom (deterministic daily puzzles)
- **Dictionary**: Enable word list (public domain)
- **Deployment**: Vercel

## Development

### Prerequisites
- Node.js 18+
- npm

### Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run linter
npm test         # Run tests
```

### Project Structure

```
src/
├── app/           # Next.js pages and layouts
├── components/    # React components (Game, Board, Rack, etc.)
├── lib/           # Core logic (puzzle gen, validation, dictionary)
├── types/         # TypeScript type definitions
└── constants/     # Game configuration
```

### Configuration

Key game parameters can be adjusted in `src/constants/gameConfig.ts`:

- `BOARD_SIZE`: Grid size (default 9x9)
- `PUZZLE_LETTER_COUNT`: Letters per puzzle (default 12)
- `MIN_VOWELS`: Minimum vowels guaranteed (default 3)
- Bonus square counts and multipliers

## Deployment

Deploy to Vercel:

```bash
npm run build
vercel deploy
```

Or connect your GitHub repo to Vercel for automatic deployments.

## License

MIT

## Credits

- Dictionary: [Enable Word List](https://github.com/dolph/dictionary)
- Inspired by Wordle, NYT Games, and Scrabble
