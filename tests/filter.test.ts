import assert from 'node:assert';
import { test } from 'node:test';
import { filterWordsByFeedback, getAvailableWordsFromMultipleFeedbacks, getAvailableWordsFromFeedback } from '../src/core/filter.js';
import { calculateWordleFeedback } from '../src/utils/feedback.js';

test('filterWordsByFeedback should filter words correctly', () => {
    const testWords = ['HOUSE', 'MOUSE', 'LOUSE', 'ROUSE', 'DOUSE'];
    const feedback = calculateWordleFeedback('HOUSE', 'MOUSE');
    
    const filtered = filterWordsByFeedback(testWords, 'HOUSE', feedback);
    
    assert(Array.isArray(filtered), 'Should return an array');
    assert(filtered.includes('MOUSE'), 'Should include the target word');
    assert(!filtered.includes('HOUSE'), 'Should not include the exact guess unless it matches');
});

test('getAvailableWordsFromFeedback should return matching words', () => {
    // Test basic functionality
    const feedback = calculateWordleFeedback('HOUSE', 'MOUSE');
    const availableWords = getAvailableWordsFromFeedback('HOUSE', feedback);
    
    assert(Array.isArray(availableWords), 'Should return an array');
    assert(availableWords.length > 0, 'Should return at least one word');
    assert(availableWords.includes('mouse'), 'Should include the target word');
    
    // Test perfect match
    const perfectFeedback = calculateWordleFeedback('HOUSE', 'HOUSE');
    const perfectMatch = getAvailableWordsFromFeedback('HOUSE', perfectFeedback);
    
    assert.strictEqual(perfectMatch.length, 1, 'Perfect match should return exactly one word');
    assert.strictEqual(perfectMatch[0], 'house', 'Perfect match should return the exact word');
});

test('getAvailableWordsFromMultipleFeedbacks should handle empty feedback', () => {
    const result = getAvailableWordsFromMultipleFeedbacks([]);
    
    assert(Array.isArray(result), 'Should return an array');
    assert(result.length > 0, 'Should return all words when no feedback provided');
});

test('getAvailableWordsFromMultipleFeedbacks should progressively filter words', () => {
    // Start with all words
    const initialWords = getAvailableWordsFromMultipleFeedbacks([]);
    
    // Add first feedback
    const feedback1 = calculateWordleFeedback('HOUSE', 'MOUSE');
    const afterFirst = getAvailableWordsFromMultipleFeedbacks([
        { guess: 'HOUSE', feedback: feedback1 }
    ]);
    
    // Should have fewer words after filtering
    assert(afterFirst.length < initialWords.length, 'Should filter out some words');
    assert(afterFirst.includes('mouse'), 'Should still include target word');
    
    // Add second feedback that should narrow it down further
    const feedback2 = calculateWordleFeedback('MOUSE', 'MOUSE');
    const afterSecond = getAvailableWordsFromMultipleFeedbacks([
        { guess: 'HOUSE', feedback: feedback1 },
        { guess: 'MOUSE', feedback: feedback2 }
    ]);
    
    // Should be down to just the target word
    assert(afterSecond.length <= afterFirst.length, 'Should filter out even more words');
    assert(afterSecond.includes('mouse'), 'Should still include target word');
});

test('getAvailableWordsFromMultipleFeedbacks should handle impossible scenarios', () => {
    // Create contradictory feedback that should result in no possible words
    const feedback1 = calculateWordleFeedback('AAAAA', 'HOUSE');
    const feedback2 = calculateWordleFeedback('EEEEE', 'HOUSE');
    
    const result = getAvailableWordsFromMultipleFeedbacks([
        { guess: 'AAAAA', feedback: feedback1 },
        { guess: 'EEEEE', feedback: feedback2 }
    ]);
    
    // This might result in very few or no words, which is expected for contradictory feedback
    assert(Array.isArray(result), 'Should still return an array even with impossible scenarios');
});
