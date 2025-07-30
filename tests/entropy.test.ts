import assert from 'node:assert';
import { test } from 'node:test';
import { calculateLetterStateProbabilities, calculateAverageEntropy, findHighestEntropyGuess } from '../src/core/entropy.js';
import { HighestEntropyResult, LetterState } from '../src/core/types.js';

test('calculateLetterStateProbabilities should return valid probability array', () => {
    const probabilities = calculateLetterStateProbabilities('HOUSE');
    
    // Basic structure validation
    assert(Array.isArray(probabilities), 'Should return an array');
    assert(probabilities.length > 0, 'Array should not be empty');
    
    // Each element should have the correct structure
    for (const prob of probabilities) {
        assert(typeof prob === 'object', 'Each element should be an object');
        assert('guessFeedback' in prob, 'Should have guessFeedback property');
        assert('probability' in prob, 'Should have probability property');
        assert(typeof prob.probability === 'number', 'Probability should be a number');
        assert(prob.probability >= 0 && prob.probability <= 1, 'Probability should be between 0 and 1');
        assert(Array.isArray(prob.guessFeedback), 'guessFeedback should be an array');
        assert.strictEqual(prob.guessFeedback.length, 5, 'guessFeedback should have 5 elements');
        
        // Validate each letter feedback
        for (let i = 0; i < 5; i++) {
            const letterFeedback = prob.guessFeedback[i];
            assert('letter' in letterFeedback, `Position ${i} should have letter property`);
            assert('state' in letterFeedback, `Position ${i} should have state property`);
            assert.strictEqual(letterFeedback.letter, 'house'[i], `Position ${i} letter should match guess`);
            assert(Object.values(LetterState).includes(letterFeedback.state), `Position ${i} state should be valid`);
        }
    }
});

test('calculateLetterStateProbabilities should have probabilities sum to approximately 1', () => {
    const probabilities = calculateLetterStateProbabilities('HOUSE');
    
    const totalProbability = probabilities.reduce((sum, prob) => sum + prob.probability, 0);
    
    // Allow for small floating point errors
    assert(Math.abs(totalProbability - 1.0) < 0.000001, 
        `Total probability should be approximately 1, got ${totalProbability}`);
});

test('calculateLetterStateProbabilities should include matching words cache', () => {
    const probabilities = calculateLetterStateProbabilities('HOUSE');
    
    // Check that matchingWords property exists and is populated
    assert(probabilities.length > 0, 'Should return probability data');
    assert('matchingWords' in probabilities[0], 'Should have matchingWords property');
    assert(Array.isArray(probabilities[0].matchingWords), 'matchingWords should be an array');
    assert(probabilities[0].matchingWords!.length > 0, 'matchingWords should not be empty');
});

test('calculateLetterStateProbabilities should include self-information', () => {
    const probabilities = calculateLetterStateProbabilities('HOUSE');
    
    for (const item of probabilities) {
        // Should have self-information calculated
        assert('selfInformation' in item, 'Should have selfInformation property');
        assert(typeof item.selfInformation === 'number', 'Self-information should be a number');
        
        // Self-information should be -log2(probability)
        const expectedSelfInformation = item.probability > 0 ? -Math.log2(item.probability) : 0;
        assert(Math.abs(item.selfInformation! - expectedSelfInformation) < 0.000001, 
            `Self-information should be -log2(probability), expected ${expectedSelfInformation}, got ${item.selfInformation}`);
        
        // Self-information should be non-negative
        assert(item.selfInformation! >= 0, 'Self-information should be non-negative');
        
        // Higher probability should mean lower self-information
        if (item.probability > 0) {
            assert(item.selfInformation! > 0, 'Self-information should be positive for non-zero probability');
        }
    }
});

test('calculateAverageEntropy should return valid entropy value', () => {
    const averageEntropy = calculateAverageEntropy('HOUSE');
    
    // Basic validation
    assert(typeof averageEntropy === 'number', 'Average entropy should be a number');
    assert(averageEntropy >= 0, 'Average entropy should be non-negative');
    assert(isFinite(averageEntropy), 'Average entropy should be finite');
    
    // Verify calculation manually
    const probabilities = calculateLetterStateProbabilities('HOUSE');
    let expectedAverage = 0;
    for (const item of probabilities) {
        expectedAverage += item.probability * item.selfInformation!;
    }
    
    assert(Math.abs(averageEntropy - expectedAverage) < 0.000001, 
        `Average entropy should match manual calculation: expected ${expectedAverage}, got ${averageEntropy}`);
    
    // Average entropy should be reasonable (between 0 and max possible entropy)
    // For Wordle, maximum entropy would be around log2(number of possible feedback patterns)
    assert(averageEntropy <= 20, 'Average entropy should be reasonable (less than 20 bits)');
    
    // Test with a different word to ensure function works generally
    const anotherEntropy = calculateAverageEntropy('ADIEU');
    assert(typeof anotherEntropy === 'number', 'Should work with different words');
    assert(anotherEntropy >= 0, 'Should be non-negative for any word');
});

test('calculateAverageEntropy should work with custom word list', () => {
    const testWordList = ['HOUSE', 'MOUSE', 'LOUSE'];
    const entropy = calculateAverageEntropy('HOUSE', testWordList);
    
    assert(typeof entropy === 'number', 'Should return a number');
    assert(entropy >= 0, 'Should be non-negative');
    assert(isFinite(entropy), 'Should be finite');
});

test('findHighestEntropyGuess should return valid result', () => {
    // Use a small subset of words for testing to make it faster
    const testWordList = ['HOUSE', 'ADIEU', 'ARISE', 'SOARE', 'TEARS', 'ROATE'];
    const result = findHighestEntropyGuess(testWordList);
    
    // Basic validation
    assert(result instanceof HighestEntropyResult, 'Should return HighestEntropyResult instance');
    assert(typeof result.guess === 'string', 'Guess should be a string');
    assert.strictEqual(result.guess.length, 5, 'Guess should be 5 letters');
    assert(typeof result.averageEntropy === 'number', 'Average entropy should be a number');
    assert(result.averageEntropy >= 0, 'Average entropy should be non-negative');
    assert(isFinite(result.averageEntropy), 'Average entropy should be finite');
    
    // Validate that the guess is actually from the test word list
    assert(testWordList.includes(result.guess.toUpperCase()), 'Guess should be from the test word list');
    
    // Verify that this is actually the highest entropy by checking all other words in our test list
    for (const testWord of testWordList) {
        const testEntropy = calculateAverageEntropy(testWord, testWordList);
        assert(result.averageEntropy >= testEntropy, 
            `Result entropy (${result.averageEntropy}) should be >= test word "${testWord}" entropy (${testEntropy})`);
    }
    
    // Test that toString works
    const resultString = result.toString();
    assert(typeof resultString === 'string', 'toString should work');
    assert(resultString.includes(result.guess), 'toString should include the guess');
    
    // Test with empty word list should throw error
    assert.throws(() => {
        findHighestEntropyGuess([]);
    }, 'Should throw error with empty word list');
});
