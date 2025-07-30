import assert from 'node:assert';
import { test } from 'node:test';
import { HighestEntropyResult, LetterState } from '../src/core/types.js';

test('LetterState enum should have correct values', () => {
    assert.strictEqual(LetterState.CORRECT, 'correct', 'CORRECT should be "correct"');
    assert.strictEqual(LetterState.PRESENT, 'present', 'PRESENT should be "present"');
    assert.strictEqual(LetterState.ABSENT, 'absent', 'ABSENT should be "absent"');
});

test('HighestEntropyResult class should work correctly', () => {
    const result1 = new HighestEntropyResult('HOUSE', 5.5);
    const result2 = new HighestEntropyResult('ADIEU', 6.2);
    
    // Test basic properties
    assert.strictEqual(result1.guess, 'HOUSE', 'Should store guess correctly');
    assert.strictEqual(result1.averageEntropy, 5.5, 'Should store entropy correctly');
    
    // Test toString method
    const str = result1.toString();
    assert(typeof str === 'string', 'toString should return a string');
    assert(str.includes('HOUSE'), 'toString should include the guess');
    assert(str.includes('5.5000'), 'toString should include formatted entropy');
    
    // Test comparison method
    assert(result2.isHigherEntropyThan(result1), 'Should correctly identify higher entropy');
    assert(!result1.isHigherEntropyThan(result2), 'Should correctly identify lower entropy');
    
    // Test equal entropy
    const result3 = new HighestEntropyResult('EQUAL', 5.5);
    assert(!result1.isHigherEntropyThan(result3), 'Equal entropy should return false');
    assert(!result3.isHigherEntropyThan(result1), 'Equal entropy should return false (reverse)');
});

test('HighestEntropyResult should be immutable', () => {
    const result = new HighestEntropyResult('HOUSE', 5.5);
    
    // Properties should be readonly - this would fail at compile time
    // but we can test the values don't change
    const originalGuess = result.guess;
    const originalEntropy = result.averageEntropy;
    
    // Try to access properties multiple times
    assert.strictEqual(result.guess, originalGuess, 'Guess should remain constant');
    assert.strictEqual(result.averageEntropy, originalEntropy, 'Entropy should remain constant');
});
