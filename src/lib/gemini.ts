// src/lib/ai.ts (formerly gemini.ts)

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export async function generateQuestionVariants(questionText: string): Promise<string[]> {
    try {
        const response = await fetch(`${API_URL}/ai/generate-variants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionText }),
            credentials: 'include' // Important for authentication
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to generate variants");
        }

        return await response.json();
    } catch (error: any) {
        console.error("AI Error:", error);
        return [error.message || "Ошибка сети", "Проверьте", "консоль", "..."];
    }
}

export async function findCorrectAnswerIndex(questionText: string, variants: string[]): Promise<number> {
    try {
        const response = await fetch(`${API_URL}/ai/find-correct-answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionText, variants }),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to find correct answer");
        }

        const data = await response.json();
        return typeof data === 'number' ? data : 0;
    } catch (error) {
        console.error("AI Error:", error);
        return 0;
    }
}
export async function findCorrectAnswersBatch(questions: { text: string, variants: string[] }[]): Promise<number[]> {
    if (questions.length === 0) return [];
    try {
        const response = await fetch(`${API_URL}/ai/batch-find-correct-answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions }),
            credentials: 'include'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to find correct answers batch");
        }

        return await response.json();
    } catch (error) {
        console.error("AI Batch Error:", error);
        return questions.map(() => 0);
    }
}
