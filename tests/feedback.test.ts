import assert from 'node:assert';
import { test } from 'node:test';
import { calculateWordleFeedback, isCorrectGuess, feedbackToString } from '../src/utils/feedback.js';
import { LetterState } from '../src/core/types.js';

test('calculateWordleFeedback should return all greens for correct word', () => {
    const feedback = calculateWordleFeedback('HOUSE', 'HOUSE');
    
    assert.strictEqual(feedback.length, 5, 'Should return feedback for 5 letters');
    
    for (let i = 0; i < 5; i++) {
        assert.strictEqual(feedback[i].state, LetterState.CORRECT, `Letter ${i} should be correct`);
        assert.strictEqual(feedback[i].letter, 'house'[i], `Letter ${i} should match`);
    }
});

test('calculateWordleFeedback should handle absent and present letters', () => {
    // Test case: guess "SOLAR" vs target "HOUSE"
    // S - present (S is in HOUSE but at position 3, not 0)
    // O - correct (same position in HOUSE)
    // L - absent (not in HOUSE)
    // A - absent (not in HOUSE)
    // R - absent (not in HOUSE)
    const feedback = calculateWordleFeedback('SOLAR', 'HOUSE');
    
    assert.strictEqual(feedback.length, 5, 'Should return feedback for 5 letters');
    
    assert.strictEqual(feedback[0].letter, 's', 'First letter should be s');
    assert.strictEqual(feedback[0].state, LetterState.PRESENT, 'S should be present (wrong position)');
    
    assert.strictEqual(feedback[1].letter, 'o', 'Second letter should be o');
    assert.strictEqual(feedback[1].state, LetterState.CORRECT, 'O should be correct (right position)');
    
    assert.strictEqual(feedback[2].letter, 'l', 'Third letter should be l');
    assert.strictEqual(feedback[2].state, LetterState.ABSENT, 'L should be absent');
    
    assert.strictEqual(feedback[3].letter, 'a', 'Fourth letter should be a');
    assert.strictEqual(feedback[3].state, LetterState.ABSENT, 'A should be absent');
    
    assert.strictEqual(feedback[4].letter, 'r', 'Fifth letter should be r');
    assert.strictEqual(feedback[4].state, LetterState.ABSENT, 'R should be absent');
});

test('calculateWordleFeedback should handle duplicate letters correctly', () => {
    // Test case: guess "ALLEY" vs target "PLANE"
    // A - correct (same position in PLANE)
    // L - present (L exists in PLANE at position 1, but guess has L at position 1)
    // L - absent (second L has no match since first L already used the only L in PLANE)
    // E - correct (same position in PLANE)
    // Y - absent (Y is not in PLANE)
    const feedback = calculateWordleFeedback('ALLEY', 'PLANE');

    assert.strictEqual(feedback[0].state, LetterState.PRESENT, 'A should be present (wrong position)');
    assert.strictEqual(feedback[1].state, LetterState.CORRECT, 'First L should be correct (right position)');
    assert.strictEqual(feedback[2].state, LetterState.ABSENT, 'Second L should be absent (no more L available in PLANE)');
    assert.strictEqual(feedback[3].state, LetterState.PRESENT, 'E should be present (wrong position)');
    assert.strictEqual(feedback[4].state, LetterState.ABSENT, 'Y should be absent');
});

test('calculateWordleFeedback should throw error for invalid input', () => {
    assert.throws(() => {
        calculateWordleFeedback('HOUSE', 'TOOLONG');
    }, 'Should throw error for mismatched lengths');
    
    assert.throws(() => {
        calculateWordleFeedback('SHRT', 'HOUSE');
    }, 'Should throw error for short guess');
    
    assert.throws(() => {
        calculateWordleFeedback('', 'HOUSE');
    }, 'Should throw error for empty guess');
});

test('isCorrectGuess should identify correct guesses', () => {
    const correctFeedback = calculateWordleFeedback('HOUSE', 'HOUSE');
    const incorrectFeedback = calculateWordleFeedback('HOUSE', 'MOUSE');
    
    assert(isCorrectGuess(correctFeedback), 'Should identify correct guess');
    assert(!isCorrectGuess(incorrectFeedback), 'Should identify incorrect guess');
});

test('feedbackToString should create valid string representation', () => {
    const feedback = calculateWordleFeedback('HOUSE', 'MOUSE');
    const str = feedbackToString(feedback);
    
    assert(typeof str === 'string', 'Should return a string');
    assert(str.includes('|'), 'Should contain separator characters');
    assert(str.includes('correct'), 'Should contain state information');
    assert(str.includes('absent'), 'Should contain state information');
});
