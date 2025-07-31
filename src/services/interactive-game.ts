import * as readline from 'readline';
import { findHighestEntropyGuess } from '../core/entropy.js';
import { getAvailableWordsFromMultipleFeedbacks } from '../core/filter.js';
import type { GuessFeedback, GuessWithFeedback } from '../core/types.js';
import { getWordList } from '../data/word-list.js';
import { calculateWordleFeedback, isCorrectGuess } from '../utils/feedback.js';

export interface GameState {
    solution: string;
    attempts: Array<{
        guess: string;
        feedback: GuessFeedback;
        isCorrect: boolean;
    }>;
    isComplete: boolean;
    isWon: boolean;
    maxAttempts: number;
}

export class InteractiveWordleGame {
    private rl: readline.Interface;
    private gameState: GameState;
    private wordList: string[];

    constructor(solution: string, maxAttempts: number = 6) {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.gameState = {
            solution: solution.toLowerCase(),
            attempts: [],
            isComplete: false,
            isWon: false,
            maxAttempts
        };

        this.wordList = getWordList();
    }

    /**
     * Start the interactive game
     */
    public async play(): Promise<GameState> {
        console.log('🎯 Welcome to Wordle!');
        console.log('─'.repeat(40));
        console.log('Enter 5-letter words to guess the solution.');
        console.log('🟩 = Correct letter in correct position');
        console.log('🟨 = Correct letter in wrong position');
        console.log('⬜ = Letter not in word');
        console.log('Type "hint" for an AI suggestion');
        console.log('Type "quit" to exit');
        console.log('─'.repeat(40));

        while (!this.gameState.isComplete) {
            await this.playTurn();
        }

        this.rl.close();
        return this.gameState;
    }

    /**
     * Play a single turn
     */
    private async playTurn(): Promise<void> {
        const attemptNumber = this.gameState.attempts.length + 1;
        const remainingAttempts = this.gameState.maxAttempts - this.gameState.attempts.length;

        console.log(`\nAttempt ${attemptNumber}/${this.gameState.maxAttempts} (${remainingAttempts} remaining)`);
        
        if (this.gameState.attempts.length > 0) {
            console.log('\nPrevious attempts:');
            this.displayAttempts();
        }

        const guess = await this.getGuess();

        if (guess === 'quit') {
            this.gameState.isComplete = true;
            console.log('\n👋 Thanks for playing!');
            return;
        }

        if (guess === 'hint') {
            await this.provideHint();
            return;
        }

        this.processGuess(guess);
    }

    /**
     * Get a guess from the player
     */
    private async getGuess(): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question('Enter your guess: ', (answer) => {
                const guess = answer.trim().toLowerCase();

                if (guess === 'quit' || guess === 'hint') {
                    resolve(guess);
                    return;
                }

                // Validate guess
                if (guess.length !== 5) {
                    console.log('❌ Please enter exactly 5 letters.');
                    resolve(this.getGuess());
                    return;
                }

                if (!/^[a-z]+$/.test(guess)) {
                    console.log('❌ Please enter only letters.');
                    resolve(this.getGuess());
                    return;
                }

                if (!this.wordList.includes(guess)) {
                    console.log('❌ Word not in word list. Try another word.');
                    resolve(this.getGuess());
                    return;
                }

                resolve(guess);
            });
        });
    }

    /**
     * Process a valid guess
     */
    private processGuess(guess: string): void {
        const feedback = calculateWordleFeedback(guess, this.gameState.solution);
        const isCorrect = isCorrectGuess(feedback);

        this.gameState.attempts.push({
            guess,
            feedback,
            isCorrect
        });

        // Display the result
        const pattern = feedback.map(f => {
            switch (f.state) {
                case 'correct': return '🟩';
                case 'present': return '🟨';
                case 'absent': return '⬜';
                default: return '?';
            }
        }).join('');

        console.log(`\n${guess.toUpperCase()} ${pattern}`);

        if (isCorrect) {
            this.gameState.isWon = true;
            this.gameState.isComplete = true;
            this.celebrateWin();
        } else if (this.gameState.attempts.length >= this.gameState.maxAttempts) {
            this.gameState.isComplete = true;
            this.revealSolution();
        }
    }

    /**
     * Display all previous attempts
     */
    private displayAttempts(): void {
        for (let i = 0; i < this.gameState.attempts.length; i++) {
            const attempt = this.gameState.attempts[i];
            const pattern = attempt.feedback.map(f => {
                switch (f.state) {
                    case 'correct': return '🟩';
                    case 'present': return '🟨';
                    case 'absent': return '⬜';
                    default: return '?';
                }
            }).join('');
            
            console.log(`${i + 1}. ${attempt.guess.toUpperCase()} ${pattern}`);
        }
    }

    /**
     * Provide an AI hint
     */
    private async provideHint(): Promise<void> {
        console.log('🤖 Calculating best guess...');
        
        try {
            // Get remaining possible words based on previous attempts
            const allFeedbacks: GuessWithFeedback[] = this.gameState.attempts.map(attempt => ({
                guess: attempt.guess,
                feedback: attempt.feedback
            }));

            let remainingWords: string[];
            if (allFeedbacks.length === 0) {
                remainingWords = this.wordList;
            } else {
                remainingWords = getAvailableWordsFromMultipleFeedbacks(allFeedbacks);
            }

            if (remainingWords.length === 0) {
                console.log('🤔 No possible words found. There might be an error in previous guesses.');
                return;
            }

            if (remainingWords.length === 1) {
                console.log(`💡 Only one word possible: ${remainingWords[0].toUpperCase()}`);
                return;
            }

            // Find the best guess
            const bestGuess = findHighestEntropyGuess(remainingWords);
            
            console.log(`💡 AI suggests: ${bestGuess.guess.toUpperCase()}`);
            console.log(`   Expected entropy: ${bestGuess.averageEntropy.toFixed(3)} bits`);
            console.log(`   ${remainingWords.length} possible words remaining`);
            
            if (remainingWords.length <= 10) {
                console.log(`   Possible words: ${remainingWords.map(w => w.toUpperCase()).join(', ')}`);
            }
            
        } catch (error) {
            console.log('❌ Error calculating hint:', error instanceof Error ? error.message : 'Unknown error');
        }
    }

    /**
     * Celebrate a win
     */
    private celebrateWin(): void {
        const attempts = this.gameState.attempts.length;
        let celebration: string;
        
        switch (attempts) {
            case 1:
                celebration = '🎯 INCREDIBLE! Hole in one! ⭐⭐⭐⭐⭐';
                break;
            case 2:
                celebration = '🔥 AMAZING! Two attempts! ⭐⭐⭐⭐';
                break;
            case 3:
                celebration = '🎉 EXCELLENT! Three attempts! ⭐⭐⭐';
                break;
            case 4:
                celebration = '👏 GREAT! Four attempts! ⭐⭐';
                break;
            case 5:
                celebration = '👍 GOOD! Five attempts! ⭐';
                break;
            case 6:
                celebration = '😅 PHEW! Just made it in six!';
                break;
            default:
                celebration = '🎉 Congratulations!';
        }
        
        console.log(`\n${celebration}`);
        console.log(`Solution: ${this.gameState.solution.toUpperCase()}`);
    }

    /**
     * Reveal the solution when the game is lost
     */
    private revealSolution(): void {
        console.log('\n😔 Game Over!');
        console.log(`The word was: ${this.gameState.solution.toUpperCase()}`);
        console.log('Better luck next time!');
    }

    /**
     * Get the current game state
     */
    public getGameState(): GameState {
        return { ...this.gameState };
    }
}
