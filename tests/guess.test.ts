import assert from 'node:assert';
import { test } from 'node:test';
import { addSelfInformationToFeedback, getAvailableWordsFromFeedback, getAverageEntropy, getHighestEntropyGuess, getLetterStateProbabilities, getLetterStateProbabilitiesWithSelfInformation, getWordList, getWordleReturnValue } from '../src/core/guess.js';
import { HighestEntropyResult, LetterState } from '../src/core/types.js';

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

test('addSelfInformationToFeedback should correctly calculate self-information', () => {
    const probabilities = getLetterStateProbabilities('HOUSE');
    const withSelfInformation = addSelfInformationToFeedback(probabilities);
    
    // Basic structure validation
    assert.strictEqual(withSelfInformation.length, probabilities.length, 'Should have same number of elements');
    
    for (let i = 0; i < withSelfInformation.length; i++) {
        const original = probabilities[i];
        const withSelfInfo = withSelfInformation[i];
        
        // Should preserve original properties
        assert.deepStrictEqual(withSelfInfo.guessFeedback, original.guessFeedback, 'guessFeedback should be preserved');
        assert.strictEqual(withSelfInfo.probability, original.probability, 'probability should be preserved');
        
        // Should have self-information calculated
        assert('selfInformation' in withSelfInfo, 'Should have selfInformation property');
        assert(typeof withSelfInfo.selfInformation === 'number', 'Self-information should be a number');
        
        // Self-information should be -log2(probability)
        const expectedSelfInformation = original.probability > 0 ? -Math.log2(original.probability) : 0;
        assert(Math.abs(withSelfInfo.selfInformation! - expectedSelfInformation) < 0.000001, 
            `Self-information should be -log2(probability), expected ${expectedSelfInformation}, got ${withSelfInfo.selfInformation}`);
        
        // Self-information should be non-negative
        assert(withSelfInfo.selfInformation! >= 0, 'Self-information should be non-negative');
        
        // Higher probability should mean lower self-information
        if (original.probability > 0) {
            assert(withSelfInfo.selfInformation! > 0, 'Self-information should be positive for non-zero probability');
        }
    }
});

test('getLetterStateProbabilitiesWithSelfInformation should return complete data', () => {
    const withSelfInformation = getLetterStateProbabilitiesWithSelfInformation('HOUSE');
    const probabilities = getLetterStateProbabilities('HOUSE');
    
    // Should have same structure as probability-only version
    assert.strictEqual(withSelfInformation.length, probabilities.length, 'Should have same number of elements');
    
    for (let i = 0; i < withSelfInformation.length; i++) {
        const item = withSelfInformation[i];
        
        // Should have all required properties
        assert('guessFeedback' in item, 'Should have guessFeedback property');
        assert('probability' in item, 'Should have probability property');
        assert('selfInformation' in item, 'Should have selfInformation property');
        
        // All properties should be valid
        assert(typeof item.probability === 'number', 'Probability should be a number');
        assert(typeof item.selfInformation === 'number', 'Self-information should be a number');
        assert(item.probability >= 0 && item.probability <= 1, 'Probability should be between 0 and 1');
        assert(item.selfInformation >= 0, 'Self-information should be non-negative');
        
        // Verify self-information calculation
        const expectedSelfInformation = item.probability > 0 ? -Math.log2(item.probability) : 0;
        assert(Math.abs(item.selfInformation - expectedSelfInformation) < 0.000001, 
            `Self-information should match -log2(probability)`);
    }
    
    // Should still sum to approximately 1
    const totalProbability = withSelfInformation.reduce((sum, item) => sum + item.probability, 0);
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
    const withSelfInformation = getLetterStateProbabilitiesWithSelfInformation('HOUSE');
    let expectedAverage = 0;
    for (const item of withSelfInformation) {
        expectedAverage += item.probability * item.selfInformation!;
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

test('getHighestEntropyGuess should return valid result', () => {
    // Use a small subset of words for testing to make it faster
    const testWordList = ['HOUSE', 'ADIEU', 'ARISE', 'SOARE', 'TEARS', 'ROATE'];
    const result = getHighestEntropyGuess(testWordList);
    
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
        const testEntropy = getAverageEntropy(testWord);
        assert(result.averageEntropy >= testEntropy, 
            `Result entropy (${result.averageEntropy}) should be >= test word "${testWord}" entropy (${testEntropy})`);
    }
    
    // Test that toString works
    const resultString = result.toString();
    assert(typeof resultString === 'string', 'toString should work');
    assert(resultString.includes(result.guess), 'toString should include the guess');
    
    // Test with empty word list should throw error
    assert.throws(() => {
        getHighestEntropyGuess([]);
    }, 'Should throw error with empty word list');
});

test('getAvailableWordsFromFeedback should return matching words', () => {
    // Test basic functionality
    const feedback = getWordleReturnValue('HOUSE', 'MOUSE');
    const availableWords = getAvailableWordsFromFeedback(feedback);
    
    assert(Array.isArray(availableWords), 'Should return an array');
    assert(availableWords.length > 0, 'Should return at least one word');
    assert(availableWords.includes('mouse'), 'Should include the target word');
    
    // Test perfect match
    const perfectFeedback = getWordleReturnValue('HOUSE', 'HOUSE');
    const perfectMatch = getAvailableWordsFromFeedback(perfectFeedback);
    
    assert.strictEqual(perfectMatch.length, 1, 'Perfect match should return exactly one word');
    assert.strictEqual(perfectMatch[0], 'house', 'Perfect match should return the exact word');
});

test('getLetterStateProbabilities should include matching words cache', () => {
    const probabilities = getLetterStateProbabilities('HOUSE');
    
    // Check that matchingWords property exists and is populated
    assert(probabilities.length > 0, 'Should return probability data');
    assert('matchingWords' in probabilities[0], 'Should have matchingWords property');
    assert(Array.isArray(probabilities[0].matchingWords), 'matchingWords should be an array');
    assert(probabilities[0].matchingWords!.length > 0, 'matchingWords should not be empty');
});

test('getAvailableWordsFromFeedback optimization works correctly', () => {
    // Simple test: exact match should return only the target word
    const perfectFeedback = getWordleReturnValue('HOUSE', 'HOUSE');
    const perfectMatch = getAvailableWordsFromFeedback(perfectFeedback);
    
    assert.strictEqual(perfectMatch.length, 1, 'Perfect match should return exactly one word');
    assert.strictEqual(perfectMatch[0], 'house', 'Should return the exact word');
    
    // Test with a partial match
    const feedback = getWordleReturnValue('HOUSE', 'MOUSE');
    const availableWords = getAvailableWordsFromFeedback(feedback);
    
    assert(Array.isArray(availableWords), 'Should return an array');
    assert(availableWords.length > 0, 'Should return at least one word');
    assert(availableWords.includes('mouse'), 'Should include the target word');
});

