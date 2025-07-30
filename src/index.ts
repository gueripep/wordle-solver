/**
 * Main API for the Wordle Solver
 * This file exports the primary functions and classes for external use
 */

// Core types
export {
    LetterState,
    LetterFeedback,
    GuessFeedback,
    GuessWithFeedback,
    GuessAttempt,
    SolveResult,
    GuessFeedbackInformations,
    HighestEntropyResult
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

// Convenience function for quick solving
import { solveWordle as solve } from './services/solver.js';
export function quickSolve(targetWord: string) {
    return solve(targetWord);
}

// Version information
export const VERSION = '2.0.0';
