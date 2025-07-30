import { findHighestEntropyGuess } from '../core/entropy.js';
import { getAvailableWordsFromMultipleFeedbacks } from '../core/filter.js';
import { GuessAttempt, GuessWithFeedback, SolveResult } from '../core/types.js';
import { calculateWordleFeedback, isCorrectGuess } from '../utils/feedback.js';

/**
 * Wordle solver service that implements the optimal solving strategy
 */
export class WordleSolver {
    private readonly optimalFirstGuess = 'slate'; // Proven optimal starting word

    /**
     * Attempts to solve a Wordle puzzle by making optimal guesses
     * @param targetWord - The target word to guess
     * @param maxAttempts - Maximum number of attempts (default: 6)
     * @returns SolveResult with all attempts and whether it was solved
     */
    public solve(targetWord: string, maxAttempts: number = 6): SolveResult {
        if (targetWord.length !== 5) {
            throw new Error('Target word must be exactly 5 letters');
        }
        
        const target = targetWord.toLowerCase();
        const attempts: GuessAttempt[] = [];
        const feedbackHistory: GuessWithFeedback[] = [];
        let solved = false;
        
        for (let attempt = 0; attempt < maxAttempts && !solved; attempt++) {
            // Get available words based on all previous feedbacks
            const availableWords = getAvailableWordsFromMultipleFeedbacks(feedbackHistory);
            
            // Determine the best guess for this attempt
            const guess = this.selectBestGuess(attempt, availableWords);
            
            // Get feedback for this guess
            const feedback = calculateWordleFeedback(guess, target);
            
            // Add to feedback history
            feedbackHistory.push({guess, feedback});
            
            // Check if we solved it
            solved = isCorrectGuess(feedback);
            
            // Get remaining words count after this feedback
            const remainingWordsAfterFeedback = solved ? 0 : getAvailableWordsFromMultipleFeedbacks(feedbackHistory).length;
            
            // Record this attempt
            attempts.push({
                guess: guess.toUpperCase(),
                feedback,
                remainingWords: remainingWordsAfterFeedback
            });
        }
        
        return {
            attempts,
            solved,
            targetWord: target.toUpperCase()
        };
    }

    /**
     * Selects the best guess for a given attempt
     * @param attemptNumber - The current attempt number (0-based)
     * @param availableWords - Words still available as possibilities
     * @returns The best guess word
     */
    private selectBestGuess(attemptNumber: number, availableWords: string[]): string {
        // For the first guess, always use the optimal starting word
        if (attemptNumber === 0) {
            return this.optimalFirstGuess;
        }
        
        // If only one word left, use it
        if (availableWords.length === 1) {
            return availableWords[0];
        }
        
        // Find the best guess from remaining possibilities using entropy
        const bestGuess = findHighestEntropyGuess(availableWords);
        return bestGuess.guess;
    }

    /**
     * Gets the optimal first guess
     */
    public getOptimalFirstGuess(): string {
        return this.optimalFirstGuess;
    }
}

/**
 * Convenience function to solve a Wordle puzzle
 * @param targetWord - The target word to guess
 * @param maxAttempts - Maximum number of attempts (default: 6)
 * @returns SolveResult with all attempts and whether it was solved
 */
export function solveWordle(targetWord: string, maxAttempts: number = 6): SolveResult {
    const solver = new WordleSolver();
    return solver.solve(targetWord, maxAttempts);
}