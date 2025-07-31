# How to Use Wordle Solver as a Library

## 🚀 Quick Start

Your Wordle Solver is now ready to be used as a library! Here's how to integrate it into other projects:

## 📦 Publishing Options

### Option 1: Publish to npm (Recommended)

```bash
# 1. Build the library
npm run build

# 2. Login to npm (if not already logged in)
npm login

# 3. Publish to npm
npm publish
```

Once published, anyone can install it with:
```bash
npm install @gueripep/wordle-solver
```

### Option 2: Use from GitHub

If you push this to GitHub, others can install directly:

```bash
npm install git+https://github.com/gueripep/wordle-solver.git
```

### Option 3: Local Development/Testing

For local testing or private use:

```bash
# In another project directory
npm install file:../path/to/wordle-solver
```

## 🛠️ Setup for Library Use

1. **Build the project first:**
   ```bash
   npm run build
   ```
   This creates the `dist/` folder with compiled JavaScript and TypeScript declarations.

2. **The main entry points are:**
   - `dist/index.js` - Compiled JavaScript
   - `dist/index.d.ts` - TypeScript type definitions

## 📋 Usage Examples

### Basic Import and Usage

```typescript
import { solveWordle, calculateAverageEntropy } from '@gueripep/wordle-solver';

// Solve a word
const result = solveWordle('HOUSE');
console.log(`Solved in ${result.attempts.length} attempts`);

// Calculate entropy
const entropy = calculateAverageEntropy('SLATE');
console.log(`SLATE entropy: ${entropy.toFixed(4)} bits`);
```

### Step-by-Step Integration Example

Create a new project:

```bash
mkdir my-wordle-app
cd my-wordle-app
npm init -y
```

Install the solver (choose one method):

```bash
# Method 1: If published to npm
npm install @gueripep/wordle-solver

# Method 2: From GitHub
npm install git+https://github.com/gueripep/wordle-solver.git

# Method 3: Local file (for development)
npm install file:../wordle-solver
```

Create `index.js`:

```javascript
import { solveWordle, findHighestEntropyGuess } from '@gueripep/wordle-solver';

// Example 1: Solve a specific word
console.log('🎯 Solving HOUSE...');
const result = solveWordle('HOUSE');
console.log(`Solved: ${result.solved}`);
console.log(`Attempts: ${result.attempts.length}`);

result.attempts.forEach((attempt, i) => {
  console.log(`${i + 1}. ${attempt.guess} (${attempt.remainingWords} words left)`);
});

// Example 2: Find best opening word
console.log('\n🔍 Finding best opening word...');
const candidates = ['SLATE', 'ADIEU', 'CRANE', 'HOUSE'];
const best = findHighestEntropyGuess(candidates);
console.log(`Best: ${best.guess} (${best.averageEntropy.toFixed(4)} bits)`);
```

Update `package.json` to use ES modules:

```json
{
  "type": "module",
  "scripts": {
    "start": "node index.js"
  }
}
```

Run it:

```bash
npm start
```

## 🎯 Advanced Usage Patterns

### Creating a Wordle Bot

```typescript
import { 
  WordleSolver, 
  calculateWordleFeedback, 
  LetterState,
  InteractiveWordleGame 
} from '@gueripep/wordle-solver';

class WordleBot {
  private solver = new WordleSolver();
  
  async solveWithHints(target: string) {
    const game = new InteractiveWordleGame();
    game.startNewGame(target);
    
    console.log(`🎯 Solving: ${target}`);
    
    while (game.getGameState() === 'playing') {
      const attempts = game.getAttempts();
      const guess = attempts.length === 0 
        ? this.solver.getOptimalFirstGuess()
        : this.solver.getOptimalGuess(game.getRemainingWords());
      
      game.makeGuess(guess);
      
      const lastAttempt = game.getAttempts().slice(-1)[0];
      console.log(`${attempts.length}. ${guess} -> ${this.formatFeedback(lastAttempt.feedback)}`);
      
      if (game.getGameState() === 'won') {
        console.log(`✅ Solved in ${game.getAttempts().length} attempts!`);
        break;
      }
    }
    
    return game.getAttempts();
  }
  
  private formatFeedback(feedback) {
    return feedback.map(f => {
      switch(f.state) {
        case LetterState.Correct: return '🟩';
        case LetterState.Present: return '🟨';
        case LetterState.Absent: return '⬛';
      }
    }).join('');
  }
}

// Usage
const bot = new WordleBot();
bot.solveWithHints('BRAIN');
```

### Word Analysis Tool

```typescript
import { calculateAverageEntropy, getWordList } from '@gueripep/wordle-solver';

class WordAnalyzer {
  analyzeMultipleWords(words: string[]) {
    return words.map(word => ({
      word,
      entropy: calculateAverageEntropy(word),
      rank: 0 // Will be set after sorting
    }))
    .sort((a, b) => b.entropy - a.entropy)
    .map((item, index) => ({ ...item, rank: index + 1 }));
  }
  
  findTopWords(count: number = 10) {
    const allWords = getWordList();
    const sample = allWords.slice(0, 100); // Analyze subset for performance
    return this.analyzeMultipleWords(sample).slice(0, count);
  }
}

// Usage
const analyzer = new WordAnalyzer();
const topWords = analyzer.findTopWords(5);
console.log('Top 5 opening words:', topWords);
```

## 🔧 Development Integration

### With TypeScript Projects

The library includes full TypeScript support:

```typescript
import type { SolveResult, LetterState, GuessAttempt } from '@gueripep/wordle-solver';
import { solveWordle } from '@gueripep/wordle-solver';

function analyzeSolution(word: string): SolveResult {
  const result = solveWordle(word);
  
  // TypeScript will provide full autocomplete and type checking
  console.log(`Target: ${result.targetWord}`);
  console.log(`Solved: ${result.solved}`);
  console.log(`Time: ${result.timeElapsed}ms`);
  
  return result;
}
```

### With React/Vue/Angular

```typescript
// React Hook example
import { useState, useEffect } from 'react';
import { solveWordle, calculateAverageEntropy } from '@gueripep/wordle-solver';

export function useWordleSolver(targetWord: string) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (targetWord && targetWord.length === 5) {
      setLoading(true);
      
      // Run solver in a timeout to avoid blocking UI
      setTimeout(() => {
        const solveResult = solveWordle(targetWord);
        setResult(solveResult);
        setLoading(false);
      }, 10);
    }
  }, [targetWord]);
  
  return { result, loading };
}
```

### With Node.js APIs

```typescript
import express from 'express';
import { solveWordle, calculateAverageEntropy } from '@gueripep/wordle-solver';

const app = express();
app.use(express.json());

app.post('/solve', (req, res) => {
  const { word } = req.body;
  
  if (!word || word.length !== 5) {
    return res.status(400).json({ error: 'Invalid word' });
  }
  
  try {
    const result = solveWordle(word.toUpperCase());
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/entropy', (req, res) => {
  const { word } = req.body;
  
  try {
    const entropy = calculateAverageEntropy(word.toUpperCase());
    res.json({ word, entropy });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Wordle solver API running on port 3000');
});
```

## 📚 Available Exports

Here's what you can import from the library:

```typescript
// Main solving functions
import { 
  solveWordle,           // Solve a word completely
  WordleSolver,          // Manual step-by-step solver
  quickSolve             // Alias for solveWordle
} from '@gueripep/wordle-solver';

// Entropy and analysis
import {
  calculateAverageEntropy,
  findHighestEntropyGuess,
  calculateLetterStateProbabilities
} from '@gueripep/wordle-solver';

// Word filtering and feedback
import {
  calculateWordleFeedback,
  filterWordsByFeedback,
  getAvailableWordsFromFeedback,
  getAvailableWordsFromMultipleFeedbacks
} from '@gueripep/wordle-solver';

// Interactive game
import {
  InteractiveWordleGame,
  GameState
} from '@gueripep/wordle-solver';

// Data access
import {
  getWordList,
  WordListRepository
} from '@gueripep/wordle-solver';

// Types
import type {
  SolveResult,
  GuessAttempt,
  LetterFeedback,
  LetterState,
  HighestEntropyResult
} from '@gueripep/wordle-solver';
```

## 🚀 Next Steps

1. **Build your library**: `npm run build`
2. **Test integration**: Create a simple test project
3. **Publish**: Choose npm, GitHub, or local distribution
4. **Document**: Add usage examples to your README
5. **Share**: Let others know about your library!

For detailed examples, see `LIBRARY_USAGE.md` and the `example-usage/` directory.
