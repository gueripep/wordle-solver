# Using Wordle Solver as a Library

This guide shows how to use the Wordle Solver in your own projects.

## Installation

### Option 1: From npm (if published)
```bash
npm install wordle-solver
```

### Option 2: From local file/GitHub
```bash
# From local directory
npm install file:../wordle-solver

# From GitHub (if repository is public)
npm install git+https://github.com/gueripep/wordle-solver.git
```

## Basic Usage Examples

### Quick Start

```typescript
import { solveWordle, calculateAverageEntropy, findHighestEntropyGuess } from '@gueripep/wordle-solver';

// Solve a specific word
const result = solveWordle('HOUSE');
console.log(`Solved "${result.targetWord}" in ${result.attempts.length} attempts`);
console.log('Solution path:', result.attempts.map(a => a.guess).join(' → '));

// Calculate entropy for word analysis
const entropy = calculateAverageEntropy('SLATE');
console.log(`SLATE has ${entropy.toFixed(4)} bits of entropy`);

// Find best word from candidates
const candidates = ['HOUSE', 'CRANE', 'SLATE', 'ADIEU'];
const best = findHighestEntropyGuess(candidates);
console.log(`Best opening word: ${best.guess} (${best.averageEntropy.toFixed(4)} bits)`);
```

### Advanced Usage - Step by Step Solving

```typescript
import { 
  WordleSolver,
  calculateWordleFeedback,
  getAvailableWordsFromMultipleFeedbacks,
  LetterState 
} from '@gueripep/wordle-solver';

const solver = new WordleSolver();
const target = 'HOUSE';
const guessHistory = [];

console.log('🎯 Solving step by step...\n');

while (guessHistory.length < 6) {
  // Get the optimal next guess
  const remainingWords = guessHistory.length === 0 
    ? solver.getWordList() 
    : getAvailableWordsFromMultipleFeedbacks(guessHistory);
  
  const guess = guessHistory.length === 0 
    ? solver.getOptimalFirstGuess() 
    : solver.getOptimalGuess(remainingWords);
  
  // Calculate feedback
  const feedback = calculateWordleFeedback(guess, target);
  guessHistory.push({ guess, feedback });
  
  // Display result
  const feedbackStr = feedback.map(f => {
    switch(f.state) {
      case LetterState.Correct: return '🟩';
      case LetterState.Present: return '🟨';
      case LetterState.Absent: return '⬛';
    }
  }).join('');
  
  console.log(`${guessHistory.length}. ${guess} ${feedbackStr}`);
  
  // Check if solved
  if (feedback.every(f => f.state === LetterState.Correct)) {
    console.log(`\n✅ Solved in ${guessHistory.length} attempts!`);
    break;
  }
  
  // Show remaining possibilities
  const remaining = getAvailableWordsFromMultipleFeedbacks(guessHistory);
  console.log(`   ${remaining.length} words remaining\n`);
}
```

### Interactive Game Integration

```typescript
import { InteractiveWordleGame, GameState } from '@gueripep/wordle-solver';

const game = new InteractiveWordleGame();

// Start a new game
game.startNewGame('HOUSE');

// Make guesses
game.makeGuess('SLATE');
console.log('Current state:', game.getGameState());

game.makeGuess('ROUSE');
console.log('Current state:', game.getGameState());

game.makeGuess('HOUSE');
console.log('Final state:', game.getGameState());

if (game.getGameState() === GameState.Won) {
  console.log(`🎉 Won in ${game.getAttempts().length} attempts!`);
}
```

### Word Analysis and Comparison

```typescript
import { calculateAverageEntropy, calculateLetterStateProbabilities } from '@gueripep/wordle-solver';

// Analyze multiple words
const words = ['SLATE', 'ADIEU', 'CRANE', 'HOUSE', 'AUDIO'];
const analysis = words.map(word => ({
  word,
  entropy: calculateAverageEntropy(word),
  probabilities: calculateLetterStateProbabilities(word)
}));

// Sort by entropy (higher is better for opening moves)
analysis.sort((a, b) => b.entropy - a.entropy);

console.log('Word Analysis (sorted by entropy):');
analysis.forEach(({ word, entropy }, index) => {
  console.log(`${index + 1}. ${word}: ${entropy.toFixed(4)} bits`);
});
```

### Custom Word Lists

```typescript
import { WordListRepository, filterWordsByFeedback } from '@gueripep/wordle-solver';

// Get the full word list
const wordRepo = new WordListRepository();
const allWords = wordRepo.getWordList();

console.log(`Total words available: ${allWords.length}`);

// Filter words based on known constraints
const feedback = [
  { letter: 'S', state: LetterState.Present },
  { letter: 'L', state: LetterState.Absent },
  { letter: 'A', state: LetterState.Absent },
  { letter: 'T', state: LetterState.Absent },
  { letter: 'E', state: LetterState.Correct }
];

const filteredWords = filterWordsByFeedback(allWords, 'SLATE', feedback);
console.log(`Words matching pattern: ${filteredWords.length}`);
console.log('Sample matches:', filteredWords.slice(0, 10));
```

## TypeScript Integration

The library is fully typed with TypeScript. Here are the main types you'll work with:

```typescript
import type { 
  SolveResult,
  GuessAttempt,
  LetterFeedback,
  LetterState,
  HighestEntropyResult 
} from '@gueripep/wordle-solver';

// SolveResult from solveWordle()
interface SolveResult {
  targetWord: string;
  solved: boolean;
  attempts: GuessAttempt[];
  timeElapsed: number;
}

// Individual guess with feedback
interface GuessAttempt {
  guess: string;
  feedback: LetterFeedback[];
  remainingWords: number;
}

// Letter-level feedback
interface LetterFeedback {
  letter: string;
  state: LetterState;
}

enum LetterState {
  Correct = 'correct',    // 🟩 Green
  Present = 'present',    // 🟨 Yellow  
  Absent = 'absent'       // ⬛ Gray
}
```

## Real-World Example: Wordle Bot

```typescript
import { solveWordle, DailyWordleService } from '@gueripep/wordle-solver';

class WordleBot {
  private dailyService = new DailyWordleService();
  
  async solveDailyPuzzle() {
    try {
      // Get today's Wordle (if available via API)
      const todaysWord = await this.dailyService.getTodaysWord();
      
      if (todaysWord) {
        const result = solveWordle(todaysWord);
        this.reportResult(result);
      } else {
        console.log('Could not fetch today\'s Wordle');
      }
    } catch (error) {
      console.error('Error solving daily puzzle:', error);
    }
  }
  
  private reportResult(result: SolveResult) {
    console.log(`\n🎯 Wordle Solver Results`);
    console.log(`Target: ${result.targetWord}`);
    console.log(`Solved: ${result.solved ? '✅' : '❌'}`);
    console.log(`Attempts: ${result.attempts.length}/6`);
    console.log(`Time: ${result.timeElapsed}ms\n`);
    
    result.attempts.forEach((attempt, index) => {
      const feedbackStr = attempt.feedback.map(f => {
        switch(f.state) {
          case 'correct': return '🟩';
          case 'present': return '🟨';
          case 'absent': return '⬛';
        }
      }).join('');
      
      console.log(`${index + 1}. ${attempt.guess} ${feedbackStr} (${attempt.remainingWords} remaining)`);
    });
  }
}

// Usage
const bot = new WordleBot();
bot.solveDailyPuzzle();
```

## Performance Considerations

- **First guess**: Always use `SLATE` (pre-calculated optimal)
- **Large word lists**: Consider caching entropy calculations
- **Real-time solving**: The solver is optimized for speed (~50ms per solution)

## Error Handling

```typescript
import { solveWordle } from '@gueripep/wordle-solver';

try {
  const result = solveWordle('HOUSE');
  console.log('Solution:', result);
} catch (error) {
  if (error.message.includes('Invalid word')) {
    console.error('Word not in dictionary');
  } else {
    console.error('Solver error:', error.message);
  }
}
```

## Contributing to the Library

If you want to extend or modify the library:

1. Clone the repository
2. Install dependencies: `npm install`
3. Make changes to `src/` files
4. Run tests: `npm test`
5. Build: `npm run build`
6. Test your changes in a separate project

## License

MIT - Feel free to use in commercial and personal projects.
