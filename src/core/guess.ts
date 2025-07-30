// This file contains the core logic for calculating the probability of each wordle guess return value 
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GuessFeedback, GuessFeedbackInformations, GuessWithFeedback, HighestEntropyResult, LetterFeedback, LetterState } from './types.js';

/**
 * Represents a single guess attempt in the solving process
 */
export interface GuessAttempt {
    guess: string;
    feedback: GuessFeedback;
    remainingWords: number;
}

/**
 * Represents the result of solving a Wordle puzzle
 */
export interface SolveResult {
    attempts: GuessAttempt[];
    solved: boolean;
    targetWord: string;
}

/**
 * Reads the word list from the wordle.csv file
 * @returns string[] - Array of words from the CSV file
 */
export function getWordList(): string[] {
    // no library used because ai can write this well enough
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const csvPath = path.join(__dirname, '../data/wordle.csv');

    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split(/\r?\n/);
    const wordList: string[] = [];

    // Assume first line is header, and 'word' is the column name
    const header = lines[0].split(',');
    const wordIndex = header.findIndex(h => h.trim().toLowerCase() === 'word');
    if (wordIndex === -1) {
        throw new Error("CSV header does not contain 'word' column");
    }

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',');
        if (cols[wordIndex]) {
            wordList.push(cols[wordIndex].toLowerCase().trim());
        }
    }
    return wordList;
}

/**
 * Calculates the Wordle feedback for a guess against a target word
 * @param guess - The 5-letter guess word
 * @param target - The 5-letter target word
 * @returns GuessFeedback - Array of 5 letter feedbacks
 */
export function getWordleReturnValue(guess: string, target: string): GuessFeedback {
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
 * Calculates the probability of each possible return value for a given guess
 * @param guess - The 5-letter guess word
 * @returns array of probabilities for each GuessFeedback
 */
export function getLetterStateProbabilities(guess: string): GuessFeedbackInformations[] {
    const wordList = getWordList();
    const feedbackCounts = new Map<string, number>();
    const feedbackToGuessFeedback = new Map<string, GuessFeedback>();
    const feedbackToWords = new Map<string, string[]>();
    
    // Calculate feedback for each possible target word
    for (const target of wordList) {
        const feedback = getWordleReturnValue(guess, target);
        
        // Create a string key for the feedback pattern
        const feedbackKey = feedback.map(f => `${f.letter}:${f.state}`).join('|');
        
        // Store the feedback object if we haven't seen this pattern
        if (!feedbackToGuessFeedback.has(feedbackKey)) {
            feedbackToGuessFeedback.set(feedbackKey, feedback);
            feedbackToWords.set(feedbackKey, []);
        }
        
        // Add this word to the list for this feedback pattern
        feedbackToWords.get(feedbackKey)!.push(target);
        
        // Count occurrences of this feedback pattern
        feedbackCounts.set(feedbackKey, (feedbackCounts.get(feedbackKey) || 0) + 1);
    }
    
    // Convert counts to probabilities
    const totalWords = wordList.length;
    const result: GuessFeedbackInformations[] = [];
    
    for (const [feedbackKey, count] of feedbackCounts.entries()) {
        const guessFeedback = feedbackToGuessFeedback.get(feedbackKey)!;
        const probability = count / totalWords;
        
        result.push({
            guessFeedback,
            probability,
            // Store the words that match this pattern for potential reuse
            matchingWords: feedbackToWords.get(feedbackKey)!
        });
    }
    
    // Sort by probability (highest first)
    result.sort((a, b) => b.probability - a.probability);
    
    return result;
}

/**
 * Calculates self-information for each GuessFeedback based on probability
 * Self-information = -log2(probability)
 * @param probabilityData - Array of GuessFeedback with probabilities
 * @returns Array with self-information added to each element
 */
export function addSelfInformationToFeedback(probabilityData: GuessFeedbackInformations[]): GuessFeedbackInformations[] {
    return probabilityData.map(item => ({
        ...item,
        selfInformation: item.probability > 0 ? -Math.log2(item.probability) : 0
    }));
}

/**
 * Calculates both probability and self-information for each possible return value for a given guess
 * @param guess - The 5-letter guess word
 * @returns array of probabilities and self-information for each GuessFeedback
 */
export function getLetterStateProbabilitiesWithSelfInformation(guess: string): GuessFeedbackInformations[] {
    const probabilityData = getLetterStateProbabilities(guess);
    return addSelfInformationToFeedback(probabilityData);
}

/**
 * Calculates the average entropy (expected self-information) for a given guess
 * @param guess - The 5-letter guess word
 * @returns average entropy value
 */
export function getAverageEntropy(guess: string): number {
    const probabilityData = getLetterStateProbabilitiesWithSelfInformation(guess);
    
    // Calculate weighted average: sum(probability * self-information)
    let weightedSum = 0;
    for (const item of probabilityData) {
        weightedSum += item.probability * item.selfInformation!;
    }
    
    return weightedSum;
}

/**
 * Calculates the highest entropy guess from the word list
 * @param wordList - Optional array of words to use, defaults to the full word list
 * @returns object with the guess and its average entropy
 */
export function getHighestEntropyGuess(wordList?: string[]): HighestEntropyResult {
    const words = wordList || getWordList();
    let bestGuess = '';
    let highestEntropy = -1;
    
    // Calculate entropy for each word in the word list
    for (const word of words) {
        const entropy = getAverageEntropy(word);
        
        if (entropy > highestEntropy) {
            highestEntropy = entropy;
            bestGuess = word;
        }
    }
    
    if (bestGuess === '') {
        throw new Error('No valid words found in word list');
    }
    
    return new HighestEntropyResult(bestGuess, highestEntropy);
}

/**
 * Get the list of available words from a GuessFeedback
 * @param guessFeedback - The GuessFeedback to analyze
 * @returns Array of words that match the feedback pattern
 */
export function getAvailableWordsFromFeedback(guessFeedback: GuessFeedback): string[] {
    // Extract the original guess from the feedback
    const originalGuess = guessFeedback.map(f => f.letter).join('');
    
    // Get all probability data which already groups words by feedback patterns
    const probabilityData = getLetterStateProbabilities(originalGuess);
    
    // Create a string key for the target feedback pattern to match against
    const targetFeedbackKey = guessFeedback.map(f => `${f.letter}:${f.state}`).join('|');
    
    // Find the matching feedback pattern in the probability data
    for (const item of probabilityData) {
        const itemFeedbackKey = item.guessFeedback.map(f => `${f.letter}:${f.state}`).join('|');
        
        if (itemFeedbackKey === targetFeedbackKey) {
            // Return the cached matching words
            return item.matchingWords || [];
        }
    }
    
    // If no matching pattern found, return empty array
    return [];
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
        availableWords = availableWords.filter(word => {
            const testFeedback = getWordleReturnValue(guess, word);
            
            // Check if this word produces the same feedback pattern
            for (let i = 0; i < 5; i++) {
                if (testFeedback[i].state !== feedback[i].state) {
                    return false;
                }
            }
            return true;
        });
        
        // Early exit if no words remain
        if (availableWords.length === 0) {
            break;
        }
    }
    
    return availableWords;
}

/**
 * Attempts to solve a Wordle puzzle by making optimal guesses
 * @param targetWord - The target word to guess
 * @param maxAttempts - Maximum number of attempts (default: 6)
 * @returns SolveResult with all attempts and whether it was solved
 */
export function solveWordle(targetWord: string, maxAttempts: number = 6): SolveResult {
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
        
        // For the first guess, always use SLATE as it's a proven optimal starting word
        // For subsequent guesses, use the highest entropy word from remaining possibilities
        let guess: string;
        
        if (attempt === 0) {
            // Always use SLATE as the first guess for optimal performance
            guess = 'slate';
        } else {
            // If only one word left, use it
            if (availableWords.length === 1) {
                guess = availableWords[0];
            } else {
                // Find the best guess from remaining possibilities
                const bestGuess = getHighestEntropyGuess(availableWords);
                guess = bestGuess.guess;
            }
        }
        
        // Get feedback for this guess
        const feedback = getWordleReturnValue(guess, target);
        
        // Add to feedback history
        feedbackHistory.push({guess, feedback});
        
        // Check if we solved it
        const isCorrect = feedback.every(f => f.state === LetterState.CORRECT);
        if (isCorrect) {
            solved = true;
        }
        
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

