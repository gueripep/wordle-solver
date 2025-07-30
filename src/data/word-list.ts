import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Data access layer for the Wordle word list
 */
export class WordListRepository {
    private static instance: WordListRepository;
    private wordListCache: string[] | null = null;

    private constructor() {}

    /**
     * Get singleton instance of WordListRepository
     */
    public static getInstance(): WordListRepository {
        if (!WordListRepository.instance) {
            WordListRepository.instance = new WordListRepository();
        }
        return WordListRepository.instance;
    }

    /**
     * Reads the word list from the wordle.csv file
     * @returns string[] - Array of words from the CSV file
     */
    public getWordList(): string[] {
        if (this.wordListCache !== null) {
            return this.wordListCache;
        }

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const csvPath = path.join(__dirname, 'wordle.csv');

        const fileContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = fileContent.split(/\r?\n/);
        const wordList: string[] = [];

        // Assume first line is header, and 'word' is the column name
        const header = lines[0].split(',');
        const wordIndex = header.findIndex(h => h.trim().toLowerCase() === 'word');
        if (wordIndex === -1) {
            throw new Error("CSV header does not contain 'word' column");
        }

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = line.split(',');
            if (cols[wordIndex]) {
                wordList.push(cols[wordIndex].toLowerCase().trim());
            }
        }

        this.wordListCache = wordList;
        return wordList;
    }

    /**
     * Check if a word exists in the word list
     */
    public isValidWord(word: string): boolean {
        const wordList = this.getWordList();
        return wordList.includes(word.toLowerCase());
    }

    /**
     * Get word list count
     */
    public getWordCount(): number {
        return this.getWordList().length;
    }

    /**
     * Clear cache (useful for testing)
     */
    public clearCache(): void {
        this.wordListCache = null;
    }
}

/**
 * Convenience function to get word list
 */
export function getWordList(): string[] {
    return WordListRepository.getInstance().getWordList();
}
