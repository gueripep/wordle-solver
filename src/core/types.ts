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
 * Represents the information of a GuessFeedback state
 */
export type GuessFeedbackInformations = {
    guessFeedback: GuessFeedback,
    probability: number;
    entropy?: number;
};
