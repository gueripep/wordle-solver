// This file contains the core logic for calculating the probability of each wordle guess return value 
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GuessFeedback, GuessFeedbackInformations, LetterFeedback, LetterState } from './types.js';

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
    
    // Calculate feedback for each possible target word
    for (const target of wordList) {
        const feedback = getWordleReturnValue(guess, target);
        
        // Create a string key for the feedback pattern
        const feedbackKey = feedback.map(f => `${f.letter}:${f.state}`).join('|');
        
        // Store the feedback object if we haven't seen this pattern
        if (!feedbackToGuessFeedback.has(feedbackKey)) {
            feedbackToGuessFeedback.set(feedbackKey, feedback);
        }
        
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
            probability
            // entropy is optional and not calculated here
        });
    }
    
    // Sort by probability (highest first)
    result.sort((a, b) => b.probability - a.probability);
    
    return result;
}

/**
 * Calculates entropy for each GuessFeedback based on probability
 * Entropy = -log2(probability)
 * @param probabilityData - Array of GuessFeedback with probabilities
 * @returns Array with entropy added to each element
 */
export function addEntropyToFeedback(probabilityData: GuessFeedbackInformations[]): GuessFeedbackInformations[] {
    return probabilityData.map(item => ({
        ...item,
        entropy: item.probability > 0 ? -Math.log2(item.probability) : 0
    }));
}

/**
 * Calculates both probability and entropy for each possible return value for a given guess
 * @param guess - The 5-letter guess word
 * @returns array of probabilities and entropies for each GuessFeedback
 */
export function getLetterStateProbabilitiesWithEntropy(guess: string): GuessFeedbackInformations[] {
    const probabilityData = getLetterStateProbabilities(guess);
    return addEntropyToFeedback(probabilityData);
}

/**
 * Calculates the average entropy for a given guess
 * @param guess - The 5-letter guess word
 * @returns average entropy value
 */
export function getAverageEntropy(guess: string): number {
    const probabilityData = getLetterStateProbabilitiesWithEntropy(guess);
    
    // Calculate weighted average: sum(probability * entropy)
    let weightedSum = 0;
    for (const item of probabilityData) {
        weightedSum += item.probability * item.entropy!;
    }
    
    return weightedSum;
}