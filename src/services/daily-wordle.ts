/**
 * Service for fetching and managing daily Wordle puzzles from NYTimes
 */

export interface DailyWordleData {
    id: number;
    solution: string;
    print_date: string;
    days_since_launch: number;
    editor: string;
}

export class DailyWordleService {
    private static readonly BASE_URL = 'https://www.nytimes.com/svc/wordle/v2/';

    /**
     * Fetch today's Wordle puzzle
     */
    public static async getTodaysWordle(): Promise<DailyWordleData> {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const url = `${this.BASE_URL}${today}.json`;

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch daily Wordle: ${response.status} ${response.statusText}`);
            }

            const data: DailyWordleData = await response.json();
            
            // Validate the response
            if (!data.solution || data.solution.length !== 5) {
                throw new Error('Invalid Wordle data: solution is missing or not 5 letters');
            }

            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error fetching daily Wordle: ${error.message}`);
            }
            throw new Error('Unknown error fetching daily Wordle');
        }
    }

    /**
     * Fetch Wordle puzzle for a specific date
     */
    public static async getWordleForDate(date: string): Promise<DailyWordleData> {
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            throw new Error('Date must be in YYYY-MM-DD format');
        }

        const url = `${this.BASE_URL}${date}.json`;

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch Wordle for ${date}: ${response.status} ${response.statusText}`);
            }

            const data: DailyWordleData = await response.json();
            
            // Validate the response
            if (!data.solution || data.solution.length !== 5) {
                throw new Error('Invalid Wordle data: solution is missing or not 5 letters');
            }

            return data;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error fetching Wordle for ${date}: ${error.message}`);
            }
            throw new Error(`Unknown error fetching Wordle for ${date}`);
        }
    }

    /**
     * Format date for display
     */
    public static formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}
