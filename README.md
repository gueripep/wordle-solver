# Wordle Solver

A Wordle solver largely inspired by [this 3Blue1Brown video](https://youtu.be/v68zYyaEmEA?si=PAkyAdpUDy6BNUVB)
This doesn't use word probability for now

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Try solving a word
npm run dev solve HOUSE

# Calculate entropy for a word
npm run dev entropy SLATE

# Compare two words
npm run dev compare HOUSE ADIEU
```

## 🎮 CLI Usage

The solver includes an interactive CLI for testing and analysis:

```bash
# Solve a Wordle puzzle
npm run dev solve <target-word>
npm run dev solve CRANE

# Calculate average entropy for a word
npm run dev entropy <word>
npm run dev entropy ADIEU

# Compare entropy of two words
npm run dev compare <word1> <word2>
npm run dev compare HOUSE SLATE

# Show help
npm run dev help
```

### Example Output

```bash
$ npm run dev solve HOUSE

Solving Wordle for target word: HOUSE
══════════════════════════════════════════════════
Attempts: 3/6
Solved: ✅ Yes
Time: 42ms

1. SLATE 🟨⬛⬛⬛🟩 (92 words remaining)
2. ROUSE ⬛🟩🟩🟩🟩 (5 words remaining)  
3. HOUSE 🟩🟩🟩🟩🟩 (0 words remaining)

Excellent! 🔥 Solved in 3 attempts!
```

## 📚 Programmatic API

### Basic Usage

```typescript
import { solveWordle, calculateAverageEntropy, findHighestEntropyGuess } from '@gueripep/wordle-solver';

// Solve a puzzle
const result = solveWordle('HOUSE');
console.log(`Solved in ${result.attempts.length} attempts: ${result.solved}`);

// Calculate entropy for a word
const entropy = calculateAverageEntropy('SLATE');
console.log(`SLATE entropy: ${entropy.toFixed(4)} bits`);

// Find the best guess from a list
const candidates = ['HOUSE', 'CRANE', 'SLATE', 'ADIEU'];
const best = findHighestEntropyGuess(candidates);
console.log(`Best word: ${best.guess} (${best.averageEntropy.toFixed(4)} bits)`);
```

## 🧠 How It Works

### Algorithm Strategy

The solver uses an **entropy-maximization approach**:

1. **Information Theory**: Each guess is selected to maximize expected information gain
2. **Optimal First Guess**: Always starts with "SLATE" (mathematically proven optimal)
3. **Progressive Filtering**: Eliminates impossible words after each guess
4. **Entropy Calculation**: Evaluates all possible feedback patterns and their probabilities

### Key Components

- **Feedback Calculation**: Implements Wordle's exact rules including duplicate letter handling
- **Word Filtering**: Efficiently narrows down possibilities based on accumulated clues  
- **Entropy Analysis**: Calculates information content of each possible guess
- **Optimal Selection**: Chooses the word that provides maximum expected information

## 🏗️ Architecture

The codebase follows a modular architecture:

```
src/
├── data/           # Word list management
├── core/           # Core algorithms (entropy, filtering, types)
├── utils/          # Utilities (feedback calculation)
├── services/       # High-level services (solver)
├── cli/            # Command-line interface
└── index.ts        # Main API exports
```

Each module has a single responsibility and comprehensive test coverage.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm test -- tests/entropy.test.ts
npm test -- tests/solver.test.ts
```

### Feedback Rules

Implements Wordle's exact feedback system:

- 🟩 **Green**: Letter in correct position
- 🟨 **Yellow**: Letter in word but wrong position
- ⬛ **Gray**: Letter not in word
- **Duplicates**: Handles multiple instances correctly

## 🔧 Development

### Prerequisites

- Node.js 18+
- TypeScript 5+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd wordle-solver

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev <command>
```

### Scripts

```bash
npm run build          # Compile TypeScript
npm run dev            # Run CLI in development mode
npm run test           # Run test suite
npm run test:watch     # Run tests in watch mode
```

## 🙏 Acknowledgments

- **Word list**: [steve-kasica/wordle-words](https://github.com/steve-kasica/wordle-words/tree/master)
- **Inspiration**: [3Blue1Brown - Solving Wordle using information theory](https://youtu.be/v68zYyaEmEA?si=PAkyAdpUDy6BNUVB)