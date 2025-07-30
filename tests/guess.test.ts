import assert from 'node:assert';
import { test } from 'node:test';
import { addEntropyToFeedback, getAverageEntropy, getLetterStateProbabilities, getLetterStateProbabilitiesWithEntropy, getWordList, getWordleReturnValue } from '../src/core/guess.js';
import { LetterState } from '../src/core/types.js';

test('getWordList should return a list of strings', () => {
    const wordList = getWordList();
    
    assert(Array.isArray(wordList), 'Should return an array');
    assert(wordList.length > 0, 'Array should not be empty');
    assert(typeof wordList[0] === 'string', 'Array should contain strings');
});

test('getWordleReturnValue should return all greens for correct word', () => {
    const feedback = getWordleReturnValue('HOUSE', 'HOUSE');
    
    assert.strictEqual(feedback.length, 5, 'Should return feedback for 5 letters');
    
    for (let i = 0; i < 5; i++) {
        assert.strictEqual(feedback[i].state, LetterState.CORRECT, `Letter ${i} should be correct`);
        assert.strictEqual(feedback[i].letter, 'house'[i], `Letter ${i} should match`);
    }
});

test('getWordleReturnValue should handle absent and present letters', () => {
    // Test case: guess "SOLAR" vs target "HOUSE"
    // S - present (S is in HOUSE but at position 3, not 0)
    // O - correct (same position in HOUSE)
    // L - absent (not in HOUSE)
    // A - absent (not in HOUSE)
    // R - absent (not in HOUSE)
    const feedback = getWordleReturnValue('SOLAR', 'HOUSE');
    
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

test('getWordleReturnValue should handle duplicate letters correctly', () => {
    // Test case: guess "ALLEY" vs target "PLANE"
    // A - correct (same position in PLANE)
    // L - present (L exists in PLANE at position 1, but guess has L at position 1)
    // L - absent (second L has no match since first L already used the only L in PLANE)
    // E - correct (same position in PLANE)
    // Y - absent (Y is not in PLANE)
    const feedback = getWordleReturnValue('ALLEY', 'PLANE');

    assert.strictEqual(feedback[0].state, LetterState.PRESENT, 'A should be present (wrong position)');
    assert.strictEqual(feedback[1].state, LetterState.CORRECT, 'First L should be correct (right position)');
    assert.strictEqual(feedback[2].state, LetterState.ABSENT, 'Second L should be absent (no more L available in PLANE)');
    assert.strictEqual(feedback[3].state, LetterState.PRESENT, 'E should be present (wrong position)');
    assert.strictEqual(feedback[4].state, LetterState.ABSENT, 'Y should be absent');
});

test('getLetterStateProbabilities should return valid probability array', () => {
    const probabilities = getLetterStateProbabilities('HOUSE');
    
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

test('getLetterStateProbabilities should have probabilities sum to approximately 1', () => {
    const probabilities = getLetterStateProbabilities('HOUSE');
    
    const totalProbability = probabilities.reduce((sum, prob) => sum + prob.probability, 0);
    
    // Allow for small floating point errors
    assert(Math.abs(totalProbability - 1.0) < 0.000001, 
        `Total probability should be approximately 1, got ${totalProbability}`);
});

test('addEntropyToFeedback should correctly calculate entropy', () => {
    const probabilities = getLetterStateProbabilities('HOUSE');
    const withEntropy = addEntropyToFeedback(probabilities);
    
    // Basic structure validation
    assert.strictEqual(withEntropy.length, probabilities.length, 'Should have same number of elements');
    
    for (let i = 0; i < withEntropy.length; i++) {
        const original = probabilities[i];
        const withEnt = withEntropy[i];
        
        // Should preserve original properties
        assert.deepStrictEqual(withEnt.guessFeedback, original.guessFeedback, 'guessFeedback should be preserved');
        assert.strictEqual(withEnt.probability, original.probability, 'probability should be preserved');
        
        // Should have entropy calculated
        assert('entropy' in withEnt, 'Should have entropy property');
        assert(typeof withEnt.entropy === 'number', 'Entropy should be a number');
        
        // Entropy should be -log2(probability)
        const expectedEntropy = original.probability > 0 ? -Math.log2(original.probability) : 0;
        assert(Math.abs(withEnt.entropy! - expectedEntropy) < 0.000001, 
            `Entropy should be -log2(probability), expected ${expectedEntropy}, got ${withEnt.entropy}`);
        
        // Entropy should be non-negative
        assert(withEnt.entropy! >= 0, 'Entropy should be non-negative');
        
        // Higher probability should mean lower entropy
        if (original.probability > 0) {
            assert(withEnt.entropy! > 0, 'Entropy should be positive for non-zero probability');
        }
    }
});

test('getLetterStateProbabilitiesWithEntropy should return complete data', () => {
    const withEntropy = getLetterStateProbabilitiesWithEntropy('HOUSE');
    const probabilities = getLetterStateProbabilities('HOUSE');
    
    // Should have same structure as probability-only version
    assert.strictEqual(withEntropy.length, probabilities.length, 'Should have same number of elements');
    
    for (let i = 0; i < withEntropy.length; i++) {
        const item = withEntropy[i];
        
        // Should have all required properties
        assert('guessFeedback' in item, 'Should have guessFeedback property');
        assert('probability' in item, 'Should have probability property');
        assert('entropy' in item, 'Should have entropy property');
        
        // All properties should be valid
        assert(typeof item.probability === 'number', 'Probability should be a number');
        assert(typeof item.entropy === 'number', 'Entropy should be a number');
        assert(item.probability >= 0 && item.probability <= 1, 'Probability should be between 0 and 1');
        assert(item.entropy >= 0, 'Entropy should be non-negative');
        
        // Verify entropy calculation
        const expectedEntropy = item.probability > 0 ? -Math.log2(item.probability) : 0;
        assert(Math.abs(item.entropy - expectedEntropy) < 0.000001, 
            `Entropy should match -log2(probability)`);
    }
    
    // Should still sum to approximately 1
    const totalProbability = withEntropy.reduce((sum, item) => sum + item.probability, 0);
    assert(Math.abs(totalProbability - 1.0) < 0.000001, 
        `Total probability should be approximately 1, got ${totalProbability}`);
});

test('getAverageEntropy should return valid entropy value', () => {
    const averageEntropy = getAverageEntropy('HOUSE');
    
    // Basic validation
    assert(typeof averageEntropy === 'number', 'Average entropy should be a number');
    assert(averageEntropy >= 0, 'Average entropy should be non-negative');
    assert(isFinite(averageEntropy), 'Average entropy should be finite');
    
    // Verify calculation manually
    const withEntropy = getLetterStateProbabilitiesWithEntropy('HOUSE');
    let expectedAverage = 0;
    for (const item of withEntropy) {
        expectedAverage += item.probability * item.entropy!;
    }
    
    assert(Math.abs(averageEntropy - expectedAverage) < 0.000001, 
        `Average entropy should match manual calculation: expected ${expectedAverage}, got ${averageEntropy}`);
    
    // Average entropy should be reasonable (between 0 and max possible entropy)
    // For Wordle, maximum entropy would be around log2(number of possible feedback patterns)
    assert(averageEntropy <= 20, 'Average entropy should be reasonable (less than 20 bits)');
    
    // Test with a different word to ensure function works generally
    const anotherEntropy = getAverageEntropy('ADIEU');
    assert(typeof anotherEntropy === 'number', 'Should work with different words');
    assert(anotherEntropy >= 0, 'Should be non-negative for any word');
});

