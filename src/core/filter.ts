import { getWordList } from '../data/word-list.js';
import { calculateWordleFeedback } from '../utils/feedback.js';
import { GuessFeedback, GuessWithFeedback } from './types.js';

/**
 * Filters words based on a single feedback pattern
 * @param words - Words to filter
 * @param guess - The guess that was made
 * @param feedback - The feedback received
 * @returns Array of words that match the feedback pattern
 */
export function filterWordsByFeedback(
    words: string[], 
    guess: string, 
    feedback: GuessFeedback
): string[] {
    return words.filter(word => {
        const testFeedback = calculateWordleFeedback(guess, word);
        
        // Check if this word produces the same feedback pattern
        for (let i = 0; i < 5; i++) {
            if (testFeedback[i].state !== feedback[i].state) {
                return false;
            }
        }
        return true;
    });
}

/**
 * Get the list of available words that match all provided feedback patterns
 * @param feedbacks - Array of GuessWithFeedback from previous attempts
 * @returns Array of words that match all feedback patterns
 */
export function getAvailableWordsFromMultipleFeedbacks(feedbacks: GuessWithFeedback[]): string[] {
    if (feedbacks.length === 0) {
        return getWordList();
    }
    
    // Start with all words and filter progressively
    let availableWords = getWordList();
    
    for (const {guess, feedback} of feedbacks) {
        // Filter words that match this specific feedback
        availableWords = filterWordsByFeedback(availableWords, guess, feedback);
        
        // Early exit if no words remain
        if (availableWords.length === 0) {
            break;
        }
    }
    
    return availableWords;
}

/**
 * Get the list of available words from a single GuessFeedback
 * This version extracts the guess from the feedback for backward compatibility
 * @param feedback - The GuessFeedback to analyze
 * @returns Array of words that match the feedback pattern
 */
export function getAvailableWordsFromFeedback(feedback: GuessFeedback): string[];
/**
 * Get the list of available words from a single GuessFeedback
 * @param guess - The original guess
 * @param feedback - The GuessFeedback to analyze
 * @returns Array of words that match the feedback pattern
 */
export function getAvailableWordsFromFeedback(guess: string, feedback: GuessFeedback): string[];
export function getAvailableWordsFromFeedback(
    guessOrFeedback: string | GuessFeedback, 
    feedback?: GuessFeedback
): string[] {
    let guess: string;
    let targetFeedback: GuessFeedback;
    
    if (typeof guessOrFeedback === 'string') {
        // New signature: getAvailableWordsFromFeedback(guess, feedback)
        guess = guessOrFeedback;
        targetFeedback = feedback!;
    } else {
        // Legacy signature: getAvailableWordsFromFeedback(feedback)
        // Extract the guess from the feedback
        targetFeedback = guessOrFeedback;
        guess = targetFeedback.map(f => f.letter).join('');
    }
    
    return filterWordsByFeedback(getWordList(), guess, targetFeedback);
}