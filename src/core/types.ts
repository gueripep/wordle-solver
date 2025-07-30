/**
 * Represents the possible states of a letter in a Wordle guess
 */
export enum LetterState {
    /** Letter is in the correct position */
    CORRECT = 'correct',

    /** Letter is in the word but in the wrong position */
    PRESENT = 'present',

    /** Letter is not in the word */
    ABSENT = 'absent'
}

/**
 * Represents the feedback for a single letter position in a guess
 */
export interface LetterFeedback {
    letter: string;
    state: LetterState;
}

/**
 * Represents the complete feedback for a 5-letter guess
 */
export type GuessFeedback = [LetterFeedback, LetterFeedback, LetterFeedback, LetterFeedback, LetterFeedback];

/**
 * Represents a guess attempt with its corresponding feedback
 */
export interface GuessWithFeedback {
    guess: string;
    feedback: GuessFeedback;
}

/**
 * Represents the information of a GuessFeedback state
 */
export type GuessFeedbackInformations = {
    guessFeedback: GuessFeedback,
    probability: number;
    selfInformation?: number;
    matchingWords?: string[];
};

/**
 * Represents the result of finding the highest entropy guess
 */
export class HighestEntropyResult {
    constructor(
        public readonly guess: string,
        public readonly averageEntropy: number
    ) {}

    /**
     * Returns a string representation of the result
     */
    toString(): string {
        return `Best guess: "${this.guess}" with entropy: ${this.averageEntropy.toFixed(4)} bits`;
    }

    /**
     * Checks if this result has higher entropy than another result
     */
    isHigherEntropyThan(other: HighestEntropyResult): boolean {
        return this.averageEntropy > other.averageEntropy;
    }
}
