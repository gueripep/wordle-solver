import { getWordList } from '../data/word-list.js';
import { calculateWordleFeedback, feedbackToString } from '../utils/feedback.js';
import { GuessFeedbackInformations, HighestEntropyResult } from './types.js';

/**
 * Calculates the probability of each possible return value for a given guess
 * @param guess - The 5-letter guess word
 * @param wordList - Optional word list to use, defaults to the full word list
 * @returns array of probabilities for each GuessFeedback
 */
export function calculateLetterStateProbabilities(guess: string, wordList?: string[]): GuessFeedbackInformations[] {
    const words = wordList || getWordList();
    const feedbackCounts = new Map<string, number>();
    const feedbackToGuessFeedback = new Map<string, GuessFeedbackInformations>();
    
    // Calculate feedback for each possible target word
    for (const target of words) {
        const feedback = calculateWordleFeedback(guess, target);
        
        // Create a string key for the feedback pattern
        const feedbackKey = feedbackToString(feedback);
        
        // Store the feedback object if we haven't seen this pattern
        if (!feedbackToGuessFeedback.has(feedbackKey)) {
            feedbackToGuessFeedback.set(feedbackKey, {
                guessFeedback: feedback,
                probability: 0, // Will be calculated later
                matchingWords: []
            });
        }
        
        // Add this word to the matching words list
        const feedbackInfo = feedbackToGuessFeedback.get(feedbackKey)!;
        if (!feedbackInfo.matchingWords) {
            feedbackInfo.matchingWords = [];
        }
        feedbackInfo.matchingWords.push(target);
        
        // Count occurrences of this feedback pattern
        feedbackCounts.set(feedbackKey, (feedbackCounts.get(feedbackKey) || 0) + 1);
    }
    
    // Convert counts to probabilities
    const totalWords = words.length;
    const result: GuessFeedbackInformations[] = [];
    
    for (const [feedbackKey, count] of feedbackCounts.entries()) {
        const feedbackInfo = feedbackToGuessFeedback.get(feedbackKey)!;
        const probability = count / totalWords;
        
        result.push({
            ...feedbackInfo,
            probability,
            selfInformation: probability > 0 ? -Math.log2(probability) : 0
        });
    }
    
    // Sort by probability (highest first)
    result.sort((a, b) => b.probability - a.probability);
    
    return result;
}

/**
 * Calculates the average entropy (expected self-information) for a given guess
 * @param guess - The 5-letter guess word
 * @param wordList - Optional word list to use, defaults to the full word list
 * @returns average entropy value
 */
export function calculateAverageEntropy(guess: string, wordList?: string[]): number {
    const probabilityData = calculateLetterStateProbabilities(guess, wordList);
    
    // Calculate weighted average: sum(probability * self-information)
    let weightedSum = 0;
    for (const item of probabilityData) {
        if (item.selfInformation !== undefined) {
            weightedSum += item.probability * item.selfInformation;
        }
    }
    
    return weightedSum;
}

/**
 * Calculates the highest entropy guess from the word list
 * @param wordList - Optional array of words to use, defaults to the full word list
 * @returns object with the guess and its average entropy
 */
export function findHighestEntropyGuess(wordList?: string[]): HighestEntropyResult {
    const words = wordList || getWordList();
    let bestGuess = '';
    let highestEntropy = -1;
    
    // Calculate entropy for each word in the word list
    for (const word of words) {
        const entropy = calculateAverageEntropy(word, wordList);
        
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