// src/lib/gemini.ts

export async function generateQuestionVariants(questionText: string): Promise<string[]> {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

    if (!API_KEY) {
        console.warn("Gemini API Key missing.");
        return ["Mock A", "Mock B", "Mock C", "Mock D"];
    }

    // Мы делаем инструкцию ОЧЕНЬ строгой, чтобы он не писал A) B) C)
    const prompt = `
    You are a quiz engine backend.
    For the question: "${questionText}"
    
    Generate 1 correct answer and 3 incorrect answers.
    
    CRITICAL OUTPUT FORMAT RULES:
    1. Do NOT use A), B), C), D) numbering.
    2. Do NOT use markdown or bold text.
    3. Start every answer with the tag "<variant>".
    4. The first variant MUST be the correct one.
    
    Example output format:
    <variant> Paris
    <variant> London
    <variant> Berlin
    <variant> Madrid
    `;

    try {
        // Используем стабильную версию 1.5 Flash (она лучше всего слушается инструкций по формату)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content) {
            const text = data.candidates[0].content.parts[0].text;

            // Лог в консоль, чтобы вы видели, что прислал ИИ (нажмите F12 в браузере)
            console.log("Gemini Raw Response:", text);

            const variants = text.split("<variant>")
                .map((v: string) => v.trim())
                .filter((v: string) => v.length > 0);

            // Если он все-таки добавил лишний текст в начале, берем последние 4
            if (variants.length >= 4) {
                return variants.slice(0, 4);
            }
        }

        console.error("Failed to parse variants. Raw text:", data);
        return ["Ошибка парсинга", "Попробуйте", "другой", "вопрос"];

    } catch (error) {
        console.error("Network Error:", error);
        return ["Ошибка сети", "Проверьте", "консоль", "..."];
    }
}

export async function findCorrectAnswerIndex(questionText: string, variants: string[]): Promise<number> {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

    if (!API_KEY) {
        console.warn("Gemini API Key missing.");
        return 0; // Fallback to first
    }

    const prompt = `
    You are a quiz assistant. 
    Question: "${questionText}"
    Variants:
    ${variants.map((v, i) => `${i + 1}. ${v}`).join("\n")}

    Task: Identify the correct answer from the list of variants above.
    Return ONLY the index (number) of the correct variant (1-based index).
    Example Output: 3
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content) {
            const text = data.candidates[0].content.parts[0].text.trim();
            const indexMatch = text.match(/\d+/);
            if (indexMatch) {
                const index = parseInt(indexMatch[0], 10) - 1; // Convert to 0-based
                if (index >= 0 && index < variants.length) {
                    return index;
                }
            }
        }
        return 0;
    } catch (error) {
        console.error("Gemini Find Answer Error:", error);
        return 0;
    }
}