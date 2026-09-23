import { sendTelegramMessage } from "./telegram.js";
import { askAI } from "../ai/ai.service.js";
import { COS_MATE_SYSTEM_PROMPT } from "../ai/prompts.js";

export async function handleTelegramUpdate(update) {
    if (!update.message) {
        return;
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text?.trim() || "";

    if (!text) {
        await sendTelegramMessage(
            chatId,
            "I can currently understand text messages. Image and PDF support is coming next. 📚"
        );

        return;
    }

    if (text === "/start") {
        await sendTelegramMessage(
            chatId,
            `👋 Welcome to COS MATE!

I'm your AI study companion.

I can help you:
• Understand difficult topics
• Summarize study materials
• Answer study questions
• Generate CBT questions
• Study from your documents

Send me a question to get started. 📚`
        );

        return;
    }

    if (text === "/help") {
        await sendTelegramMessage(
            chatId,
            `📚 COS MATE Help

You can send me:

• A study question
• A topic you want explained
• Study material for summarization
• A request for CBT questions

Commands:

/start - Start COS MATE
/help - Show this help

More features are coming soon. 🚀`
        );

        return;
    }

    try {
        await sendTelegramMessage(
            chatId,
            "🤔 Let me think about that..."
        );

        const response = await askAI({
            messages: [
                {
                    role: "system",
                    content: COS_MATE_SYSTEM_PROMPT
                },
                {
                    role: "user",
                    content: text
                }
            ],
            reasoningEffort: "medium"
        });

        if (!response) {
            throw new Error("AI returned an empty response.");
        }

        await sendTelegramMessage(chatId, response);

    } catch (error) {
        console.error("COS MATE AI error:", error);

        await sendTelegramMessage(
            chatId,
            `Sorry, I couldn't process that request right now.

Please try again in a moment.`
        );
    }
}