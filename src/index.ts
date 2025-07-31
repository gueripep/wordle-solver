/**
 * Main API for the Wordle Solver
 * This file exports the primary functions and classes for external use
 */

// Core types
export {
    GuessAttempt, GuessFeedback, GuessFeedbackInformations, GuessWithFeedback, HighestEntropyResult, LetterFeedback, LetterState, SolveResult
} from './core/types.js';

// Data access
export { getWordList, WordListRepository } from './data/word-list.js';

// Utility functions
export {
    calculateWordleFeedback, feedbackToString, isCorrectGuess
} from './utils/feedback.js';

// Core algorithms
export {
    calculateAverageEntropy, calculateLetterStateProbabilities, findHighestEntropyGuess
} from './core/entropy.js';

export {
    filterWordsByFeedback, getAvailableWordsFromFeedback, getAvailableWordsFromMultipleFeedbacks
} from './core/filter.js';

// High-level solver service
export { solveWordle, WordleSolver } from './services/solver.js';

// Daily Wordle and interactive game services
export { DailyWordleService } from './services/daily-wordle.js';
export { GameState, InteractiveWordleGame } from './services/interactive-game.js';

// Convenience function for quick solving
import { solveWordle as solve } from './services/solver.js';
export function quickSolve(targetWord: string) {
    return solve(targetWord);
}

// Version information
export const VERSION = '2.0.0';
