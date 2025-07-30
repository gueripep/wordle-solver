import assert from 'node:assert';
import { test } from 'node:test';
import { getWordList, WordListRepository } from '../src/data/word-list.js';

test('getWordList should return a list of strings', () => {
    const wordList = getWordList();
    
    assert(Array.isArray(wordList), 'Should return an array');
    assert(wordList.length > 0, 'Array should not be empty');
    assert(typeof wordList[0] === 'string', 'Array should contain strings');
});

test('WordListRepository singleton should work correctly', () => {
    const repo1 = WordListRepository.getInstance();
    const repo2 = WordListRepository.getInstance();
    
    assert.strictEqual(repo1, repo2, 'Should return the same instance');
});

test('WordListRepository should cache word list', () => {
    const repo = WordListRepository.getInstance();
    
    // Clear cache first
    repo.clearCache();
    
    const startTime1 = Date.now();
    const wordList1 = repo.getWordList();
    const endTime1 = Date.now();
    
    const startTime2 = Date.now();
    const wordList2 = repo.getWordList();
    const endTime2 = Date.now();
    
    // Second call should be faster (cached)
    const firstCallTime = endTime1 - startTime1;
    const secondCallTime = endTime2 - startTime2;
    
    assert(secondCallTime < firstCallTime, 'Cached call should be faster');
    assert.deepStrictEqual(wordList1, wordList2, 'Should return the same data');
});

test('WordListRepository should validate words', () => {
    const repo = WordListRepository.getInstance();
    const wordList = repo.getWordList();
    
    // Test with a word we know exists
    const firstWord = wordList[0];
    assert(repo.isValidWord(firstWord), 'Should recognize valid words');
    assert(repo.isValidWord(firstWord.toUpperCase()), 'Should be case insensitive');
    
    // Test with an invalid word
    assert(!repo.isValidWord('ZZZZZ'), 'Should reject invalid words');
});

test('WordListRepository should return correct word count', () => {
    const repo = WordListRepository.getInstance();
    const wordList = repo.getWordList();
    const count = repo.getWordCount();
    
    assert.strictEqual(count, wordList.length, 'Word count should match array length');
});
