import { groq } from "./groq.js";

export const AI_MODELS = {
    main: "openai/gpt-oss-120b",
    fast: "openai/gpt-oss-20b",
    vision: "qwen/qwen3.8-27b"
};

export async function askAI({
    messages,
    model = AI_MODELS.main,
    reasoningEffort = "medium",
    maxTokens = 2048
}) {
    if (!messages || !Array.isArray(messages)) {
        throw new Error("AI messages must be an array.");
    }

    try {
        const completion = await groq.chat.completions.create({
            model,
            messages,
            reasoning_effort: reasoningEffort,
            max_completion_tokens: maxTokens
        });

        return completion.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Groq API error:", {
            message: error.message,
            status: error.status,
            code: error.code,
            model,
            reasoningEffort
        });

        // Re-throw with more context
        if (error.status === 401) {
            throw new Error("Groq authentication failed. Check GROQ_API_KEY.");
        }
        if (error.status === 429) {
            throw new Error("Rate limit exceeded. Please try again later.");
        }
        if (error.status === 400) {
            throw new Error(`Groq bad request: ${error.message}`);
        }

        throw error;
    }
}

export async function analyzeImage(question, imageBase64Array = []) {
    const messages = [
        { role: "system", content: "You are COS MATE, an AI study companion." }
    ];

    const userContent = [
        { type: "text", text: question || "Analyze this image for study purposes." }
    ];

    for (const imageBase64 of imageBase64Array) {
        userContent.push({
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
        });
    }

    messages.push({ role: "user", content: userContent });

    return askAI({
        messages,
        model: AI_MODELS.vision,
        maxTokens: 2048
    });
}

export default { askAI, analyzeImage, AI_MODELS };