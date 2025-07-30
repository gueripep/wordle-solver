import assert from 'node:assert';
import { test } from 'node:test';
import { WordleSolver, solveWordle } from '../src/services/solver.js';

test('WordleSolver should solve simple puzzles', () => {
    const solver = new WordleSolver();
    const result = solver.solve('HOUSE');
    
    assert(typeof result === 'object', 'Should return an object');
    assert('attempts' in result, 'Should have attempts property');
    assert('solved' in result, 'Should have solved property');
    assert('targetWord' in result, 'Should have targetWord property');
    
    assert(Array.isArray(result.attempts), 'Attempts should be an array');
    assert(result.attempts.length > 0, 'Should have at least one attempt');
    assert(result.attempts.length <= 6, 'Should not exceed 6 attempts');
    
    assert(typeof result.solved === 'boolean', 'Solved should be a boolean');
    assert.strictEqual(result.targetWord, 'HOUSE', 'Should store the target word correctly');
    
    // Validate attempt structure
    for (const attempt of result.attempts) {
        assert('guess' in attempt, 'Attempt should have guess property');
        assert('feedback' in attempt, 'Attempt should have feedback property');
        assert('remainingWords' in attempt, 'Attempt should have remainingWords property');
        
        assert(typeof attempt.guess === 'string', 'Guess should be a string');
        assert.strictEqual(attempt.guess.length, 5, 'Guess should be 5 letters');
        assert(Array.isArray(attempt.feedback), 'Feedback should be an array');
        assert.strictEqual(attempt.feedback.length, 5, 'Feedback should have 5 elements');
        assert(typeof attempt.remainingWords === 'number', 'RemainingWords should be a number');
        assert(attempt.remainingWords >= 0, 'RemainingWords should be non-negative');
    }
});

test('WordleSolver should use optimal first guess', () => {
    const solver = new WordleSolver();
    const result = solver.solve('HOUSE');
    
    const firstGuess = result.attempts[0].guess;
    const optimalFirstGuess = solver.getOptimalFirstGuess().toUpperCase();
    
    assert.strictEqual(firstGuess, optimalFirstGuess, 'Should use the optimal first guess');
});

test('WordleSolver should solve within reasonable attempts', () => {
    const solver = new WordleSolver();
    
    // Test a few different words
    const testWords = ['HOUSE', 'ADIEU', 'CRANE', 'SLATE'];
    
    for (const word of testWords) {
        const result = solver.solve(word);
        
        assert(result.solved, `Should solve "${word}"`);
        assert(result.attempts.length <= 6, `Should solve "${word}" within 6 attempts, took ${result.attempts.length}`);
        
        // The last attempt should have 0 remaining words if solved
        if (result.solved) {
            const lastAttempt = result.attempts[result.attempts.length - 1];
            assert.strictEqual(lastAttempt.remainingWords, 0, 'Last attempt should have 0 remaining words when solved');
        }
    }
});

test('WordleSolver should handle maximum attempts limit', () => {
    const solver = new WordleSolver();
    
    // Test with a very low attempt limit
    const result = solver.solve('HOUSE', 1);
    
    assert(result.attempts.length <= 1, 'Should respect maximum attempts limit');
    
    // Test with the default limit
    const defaultResult = solver.solve('HOUSE');
    assert(defaultResult.attempts.length <= 6, 'Should use default limit of 6');
});

test('WordleSolver should throw error for invalid input', () => {
    const solver = new WordleSolver();
    
    assert.throws(() => {
        solver.solve('TOOLONG');
    }, 'Should throw error for words longer than 5 letters');
    
    assert.throws(() => {
        solver.solve('SHRT');
    }, 'Should throw error for words shorter than 5 letters');
    
    assert.throws(() => {
        solver.solve('');
    }, 'Should throw error for empty string');
});

test('solveWordle convenience function should work', () => {
    const result = solveWordle('HOUSE');
    
    assert(typeof result === 'object', 'Should return an object');
    assert('attempts' in result, 'Should have attempts property');
    assert('solved' in result, 'Should have solved property');
    assert('targetWord' in result, 'Should have targetWord property');
    
    assert(result.solved, 'Should solve the puzzle');
    assert(result.attempts.length > 0, 'Should have at least one attempt');
});

test('WordleSolver should show decreasing remaining words', () => {
    const solver = new WordleSolver();
    const result = solver.solve('HOUSE');
    
    // Remaining words should generally decrease with each attempt
    // (except possibly the last one which might be 0)
    for (let i = 1; i < result.attempts.length; i++) {
        const current = result.attempts[i].remainingWords;
        const previous = result.attempts[i - 1].remainingWords;
        
        // Current should be <= previous (allowing for edge cases)
        assert(current <= previous, 
            `Remaining words should decrease or stay same: attempt ${i} has ${current}, previous had ${previous}`);
    }
});
