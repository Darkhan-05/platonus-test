// src/lib/gemini.ts

export async function generateQuestionVariants(questionText: string): Promise<string[]> {
  // Try to use environment variable if exposed by Vite (usually needs VITE_ prefix)
  // Or fall back to a placeholder that the user must replace.
  // Since this is a browser-side simulation requested by the user, we will try to make the call.
  // Note: exposing API key in frontend is not secure, but user requested "Simulation within frontend".

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

  if (!API_KEY) {
      console.warn("Gemini API Key missing. Returning mock data.");
      return [
          "Mock Answer A (Correct)",
          "Mock Answer B",
          "Mock Answer C",
          "Mock Answer D"
      ];
  }

  const prompt = `
    For the following quiz question, generate 1 correct answer and 3 incorrect answers.
    Format the output strictly as:
    <variant> Correct Answer
    <variant> Incorrect Answer 1
    <variant> Incorrect Answer 2
    <variant> Incorrect Answer 3

    Question: "${questionText}"
  `;

  try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              contents: [{
                  parts: [{ text: prompt }]
              }]
          })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const text = data.candidates[0].content.parts[0].text;
          // Extract variants from text
          const variants = text.split("<variant>")
              .map((v: string) => v.trim())
              .filter((v: string) => v.length > 0);

          if (variants.length >= 4) return variants;
      }

      throw new Error("Failed to parse Gemini response");

  } catch (error) {
      console.error("Gemini API Error:", error);
      return [
          "Error Generating A (Correct)",
          "Error Generating B",
          "Error Generating C",
          "Error Generating D"
      ];
  }
}
