#!/usr/bin/env node

import { getAverageEntropy, getLetterStateProbabilitiesWithSelfInformation, solveWordle } from '../core/guess.js';

/**
 * Simple CLI for testing Wordle solver functions
 */
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        showHelp();
        return;
    }
    
    const command = args[0].toLowerCase();
    
    switch (command) {
        case 'entropy':
            handleEntropyCommand(args.slice(1));
            break;
        case 'compare':
            handleCompareCommand(args.slice(1));
            break;
        case 'solve':
            handleSolveCommand(args.slice(1));
            break;
        case 'help':
        case '--help':
        case '-h':
            showHelp();
            break;
        default:
            console.error(`Unknown command: ${command}`);
            showHelp();
            process.exit(1);
    }
}

function showHelp() {
    console.log(`
Wordle Solver CLI

Usage:
  npm run dev entropy <word>           Calculate average entropy for a word
  npm run dev compare <word1> <word2>  Compare average entropy of two words
  npm run dev solve <target>           Solve a Wordle puzzle for a target word
  npm run dev help                     Show this help message

Examples:
  npm run dev entropy HOUSE
  npm run dev entropy ADIEU
  npm run dev compare HOUSE ADIEU
  npm run dev solve HOUSE

Note: Words should be exactly 5 letters long.
`);
}

function handleEntropyCommand(args: string[]) {
    if (args.length !== 1) {
        console.error('Error: entropy command requires exactly one word');
        console.log('Usage: npm run dev entropy <word>');
        process.exit(1);
    }
    
    const word = args[0].toUpperCase();
    
    if (word.length !== 5) {
        console.error('Error: Word must be exactly 5 letters long');
        process.exit(1);
    }
    
    if (!/^[A-Z]+$/.test(word)) {
        console.error('Error: Word must contain only letters');
        process.exit(1);
    }
    
    console.log(`\nCalculating entropy for word: ${word}`);
    console.log('═'.repeat(40));
    
    try {
        const startTime = Date.now();
        const averageEntropy = getAverageEntropy(word);
        const endTime = Date.now();
        
        console.log(`Average Entropy: ${averageEntropy.toFixed(4)} bits`);
        console.log(`Calculation time: ${endTime - startTime}ms`);
        
        // Show some additional context
        const probabilityData = getLetterStateProbabilitiesWithSelfInformation(word);
        console.log(`Number of possible feedback patterns: ${probabilityData.length}`);
        
        // Show top 5 most likely outcomes
        console.log('\nTop 5 most likely feedback patterns:');
        console.log('─'.repeat(40));
        for (let i = 0; i < Math.min(5, probabilityData.length); i++) {
            const item = probabilityData[i];
            const pattern = item.guessFeedback.map(f => {
                switch (f.state) {
                    case 'correct': return '🟩';
                    case 'present': return '🟨';
                    case 'absent': return '⬜';
                    default: return '?';
                }
            }).join('');
            console.log(`${i + 1}. ${pattern} (${(item.probability * 100).toFixed(2)}% - ${item.selfInformation!.toFixed(2)} bits)`);
        }
        
    } catch (error) {
        console.error('Error calculating entropy:', error);
        process.exit(1);
    }
}

function handleCompareCommand(args: string[]) {
    if (args.length !== 2) {
        console.error('Error: compare command requires exactly two words');
        console.log('Usage: npm run dev compare <word1> <word2>');
        process.exit(1);
    }
    
    const word1 = args[0].toUpperCase();
    const word2 = args[1].toUpperCase();
    
    for (const word of [word1, word2]) {
        if (word.length !== 5) {
            console.error(`Error: Word "${word}" must be exactly 5 letters long`);
            process.exit(1);
        }
        
        if (!/^[A-Z]+$/.test(word)) {
            console.error(`Error: Word "${word}" must contain only letters`);
            process.exit(1);
        }
    }
    
    console.log(`\nComparing entropy: ${word1} vs ${word2}`);
    console.log('═'.repeat(50));
    
    try {
        const startTime1 = Date.now();
        const entropy1 = getAverageEntropy(word1);
        const endTime1 = Date.now();
        
        const startTime2 = Date.now();
        const entropy2 = getAverageEntropy(word2);
        const endTime2 = Date.now();
        
        console.log(`${word1}: ${entropy1.toFixed(4)} bits (${endTime1 - startTime1}ms)`);
        console.log(`${word2}: ${entropy2.toFixed(4)} bits (${endTime2 - startTime2}ms)`);
        
        const difference = Math.abs(entropy1 - entropy2);
        const betterWord = entropy1 > entropy2 ? word1 : word2;
        const higherEntropy = Math.max(entropy1, entropy2);
        
        console.log('─'.repeat(50));
        console.log(`Better choice: ${betterWord} (${higherEntropy.toFixed(4)} bits)`);
        console.log(`Difference: ${difference.toFixed(4)} bits (${((difference / Math.min(entropy1, entropy2)) * 100).toFixed(2)}% improvement)`);
        
    } catch (error) {
        console.error('Error calculating entropy:', error);
        process.exit(1);
    }
}

function handleSolveCommand(args: string[]) {
    if (args.length !== 1) {
        console.error('Error: solve command requires exactly one target word');
        console.log('Usage: npm run dev solve <target>');
        process.exit(1);
    }
    
    const targetWord = args[0].toUpperCase();
    
    if (targetWord.length !== 5) {
        console.error('Error: Target word must be exactly 5 letters long');
        process.exit(1);
    }
    
    if (!/^[A-Z]+$/.test(targetWord)) {
        console.error('Error: Target word must contain only letters');
        process.exit(1);
    }
    
    console.log(`\nSolving Wordle for target word: ${targetWord}`);
    console.log('═'.repeat(50));
    
    try {
        const startTime = Date.now();
        const result = solveWordle(targetWord);
        const endTime = Date.now();
        
        console.log(`\nAttempts: ${result.attempts.length}/6`);
        console.log(`Solved: ${result.solved ? '✅ Yes' : '❌ No'}`);
        console.log(`Time: ${endTime - startTime}ms\n`);
        
        // Display each attempt with Wordle-style feedback
        for (let i = 0; i < result.attempts.length; i++) {
            const attempt = result.attempts[i];
            const colors = attempt.feedback.map(f => {
                switch (f.state) {
                    case 'correct': return '🟩';
                    case 'present': return '🟨';
                    case 'absent': return '⬜';
                    default: return '?';
                }
            }).join('');
            
            console.log(`${i + 1}. ${attempt.guess} ${colors} (${attempt.remainingWords} words remaining)`);
        }
        
        if (result.solved) {
            const attempts = result.attempts.length;
            let performance: string;
            if (attempts <= 2) performance = 'Exceptional! 🎯';
            else if (attempts <= 3) performance = 'Excellent! 🔥';
            else if (attempts <= 4) performance = 'Good! 👍';
            else if (attempts <= 5) performance = 'Not bad! 👌';
            else performance = 'Close call! 😅';
            
            console.log(`\n${performance} Solved in ${attempts} attempt${attempts === 1 ? '' : 's'}!`);
        } else {
            console.log('\n😔 Failed to solve within 6 attempts.');
            if (result.attempts.length > 0) {
                const lastAttempt = result.attempts[result.attempts.length - 1];
                console.log(`${lastAttempt.remainingWords} possible word${lastAttempt.remainingWords === 1 ? '' : 's'} remaining.`);
            }
        }
        
    } catch (error) {
        console.error('Error solving puzzle:', error);
        process.exit(1);
    }
}

// Run the CLI if this file is executed directly
main();