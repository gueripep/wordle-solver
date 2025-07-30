import { GuessFeedback, LetterFeedback, LetterState } from '../core/types.js';

/**
 * Calculates the Wordle feedback for a guess against a target word
 * @param guess - The 5-letter guess word
 * @param target - The 5-letter target word
 * @returns GuessFeedback - Array of 5 letter feedbacks
 */
export function calculateWordleFeedback(guess: string, target: string): GuessFeedback {
    if (guess.length !== 5 || target.length !== 5) {
        throw new Error('Both guess and target must be exactly 5 letters');
    }
    
    const guessLower = guess.toLowerCase();
    const targetLower = target.toLowerCase();
    const result: LetterFeedback[] = [];
    const targetLetters = targetLower.split('');
    const usedTargetIndices = new Set<number>();
    
    // First pass: mark correct positions
    for (let i = 0; i < 5; i++) {
        if (guessLower[i] === targetLower[i]) {
            result[i] = {
                letter: guessLower[i],
                state: LetterState.CORRECT
            };
            usedTargetIndices.add(i);
        } else {
            result[i] = {
                letter: guessLower[i],
                state: LetterState.ABSENT // Default, will be updated if present
            };
        }
    }
    
    // Second pass: check for present letters (wrong position)
    for (let i = 0; i < 5; i++) {
        if (result[i].state === LetterState.ABSENT) {
            // Look for this letter in unused positions of target
            for (let j = 0; j < 5; j++) {
                if (!usedTargetIndices.has(j) && guessLower[i] === targetLower[j]) {
                    result[i].state = LetterState.PRESENT;
                    usedTargetIndices.add(j);
                    break;
                }
            }
        }
    }
    
    return result as GuessFeedback;
}

/**
 * Checks if a feedback indicates a correct guess (all letters are CORRECT)
 */
export function isCorrectGuess(feedback: GuessFeedback): boolean {
    return feedback.every(f => f.state === LetterState.CORRECT);
}

/**
 * Creates a string representation of feedback for debugging/display
 */
export function feedbackToString(feedback: GuessFeedback): string {
    return feedback.map(f => `${f.letter}:${f.state}`).join('|');
}