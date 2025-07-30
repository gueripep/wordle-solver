import assert from 'node:assert';
import { test } from 'node:test';
import { solveWordle } from '../src/services/solver.js';
import { calculateWordleFeedback } from '../src/utils/feedback.js';
import { getAvailableWordsFromMultipleFeedbacks } from '../src/core/filter.js';
import { calculateAverageEntropy } from '../src/core/entropy.js';

test('Integration: Full solve workflow should work end-to-end', () => {
    const result = solveWordle('HOUSE');
    
    assert(result.solved, 'Should solve the puzzle');
    assert(result.attempts.length <= 6, 'Should solve within 6 attempts');
    assert.strictEqual(result.targetWord, 'HOUSE', 'Should have correct target word');
    
    // Verify each step of the solution makes sense
    const feedbackHistory = [];
    for (let i = 0; i < result.attempts.length; i++) {
        const attempt = result.attempts[i];
        
        // Add this attempt to history
        feedbackHistory.push({
            guess: attempt.guess.toLowerCase(),
            feedback: attempt.feedback
        });
        
        // Verify the remaining words count is accurate
        const calculatedRemaining = getAvailableWordsFromMultipleFeedbacks(feedbackHistory);
        
        if (i < result.attempts.length - 1 || !result.solved) {
            // For all attempts except the last successful one
            assert.strictEqual(attempt.remainingWords, calculatedRemaining.length, 
                `Attempt ${i + 1}: Remaining words count should match filter result`);
        } else {
            // For the final successful attempt
            assert.strictEqual(attempt.remainingWords, 0, 
                'Final successful attempt should have 0 remaining words');
        }
    }
});

test('Integration: Feedback calculation and filtering should be consistent', () => {
    const guess = 'HOUSE';
    const target = 'MOUSE';
    
    // Calculate feedback
    const feedback = calculateWordleFeedback(guess, target);
    
    // Use feedback to filter words
    const available = getAvailableWordsFromMultipleFeedbacks([
        { guess: guess.toLowerCase(), feedback }
    ]);
    
    // The target word should be in the available words
    assert(available.includes(target.toLowerCase()), 'Target word should be in filtered results');
    
    // The guess word should only be included if it matches the target
    if (guess.toLowerCase() !== target.toLowerCase()) {
        assert(!available.includes(guess.toLowerCase()), 'Guess word should not be in results when different from target');
    }
});

test('Integration: Entropy calculation should guide good guesses', () => {
    // Test that words with higher entropy are generally better first guesses
    const commonFirstGuesses = ['ADIEU', 'ARISE', 'SOARE', 'SLATE', 'HOUSE'];
    const entropies = commonFirstGuesses.map(word => ({
        word,
        entropy: calculateAverageEntropy(word)
    }));
    
    // All should have reasonable entropy values
    for (const item of entropies) {
        assert(item.entropy > 0, `${item.word} should have positive entropy`);
        assert(item.entropy < 15, `${item.word} should have reasonable entropy (< 15 bits)`);
    }
    
    // The solver's optimal first guess should have high entropy
    const optimalGuess = 'SLATE'; // As defined in solver
    const optimalEntropy = calculateAverageEntropy(optimalGuess);
    
    // It should be competitive with other good guesses
    const averageEntropy = entropies.reduce((sum, item) => sum + item.entropy, 0) / entropies.length;
    assert(optimalEntropy >= averageEntropy * 0.95, 
        'Optimal guess should have competitive entropy compared to other common first guesses');
});

test('Integration: Multiple solve attempts should be consistent', () => {
    const targetWords = ['HOUSE', 'CRANE', 'ADIEU'];
    
    for (const target of targetWords) {
        // Solve the same word multiple times
        const result1 = solveWordle(target);
        const result2 = solveWordle(target);
        
        // Results should be identical (deterministic)
        assert.strictEqual(result1.solved, result2.solved, `Solve consistency for ${target}: solved status`);
        assert.strictEqual(result1.attempts.length, result2.attempts.length, `Solve consistency for ${target}: attempt count`);
        
        // Each attempt should be identical
        for (let i = 0; i < result1.attempts.length; i++) {
            assert.strictEqual(result1.attempts[i].guess, result2.attempts[i].guess, 
                `Solve consistency for ${target}: attempt ${i + 1} guess`);
            assert.deepStrictEqual(result1.attempts[i].feedback, result2.attempts[i].feedback, 
                `Solve consistency for ${target}: attempt ${i + 1} feedback`);
        }
    }
});
