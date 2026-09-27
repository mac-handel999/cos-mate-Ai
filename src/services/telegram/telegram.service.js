import { sendTelegramMessage, sendTypingAction } from "./telegram.js";
import { askAI } from "../ai/ai.service.js";
import { COS_MATE_SYSTEM_PROMPT } from "../ai/prompts.js";
import { findOrCreateUser } from "../users/user.service.js";
import { getOrCreateConversation } from "../conversations/conversation.service.js";
import { saveMessage } from "../memory/memory.service.js";
import { buildChatContext } from "../ai/context.service.js";

export async function handleTelegramUpdate(update) {
    if (!update.message) {
        return;
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text?.trim() || "";
    const telegramUserId = message.from?.id;
    const telegramUsername = message.from?.username;
    const telegramFirstName = message.from?.first_name;

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
        // Send typing indicator
        await sendTypingAction(chatId);

        // Try to save to Supabase, but don't fail if it's not configured
        let user = null;
        let conversation = null;
        let contextMessages = [];

        try {
            // Step 1: Find or create user
            user = await findOrCreateUser({
                platform: "telegram",
                externalUserId: String(telegramUserId),
                displayName: telegramFirstName || telegramUsername
            });

            // Step 2: Get or create conversation
            conversation = await getOrCreateConversation({
                userId: user.id,
                platform: "telegram",
                externalChatId: String(chatId)
            });

            // Step 3: Save user message
            await saveMessage({
                conversationId: conversation.id,
                platformMessageId: String(message.message_id),
                senderType: "user",
                messageType: "text",
                text
            });

            // Step 4: Build AI context from conversation history
            contextMessages = await buildChatContext(conversation.id, 12);

        } catch (supabaseError) {
            console.warn("Supabase unavailable, continuing without memory:", supabaseError.message);
        }

        // Step 5: Get AI response
        const response = await askAI({
            messages: [
                {
                    role: "system",
                    content: COS_MATE_SYSTEM_PROMPT
                },
                ...contextMessages,
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

        // Try to save AI response
        if (conversation) {
            try {
                await saveMessage({
                    conversationId: conversation.id,
                    senderType: "assistant",
                    messageType: "text",
                    text: response
                });
            } catch (saveError) {
                console.warn("Could not save AI response:", saveError.message);
            }
        }

        // Step 7: Send response to Telegram
        await sendTelegramMessage(chatId, response);

    } catch (error) {
        console.error("COS MATE AI error:", error);
        console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            telegramUserId,
            chatId,
            text
        });

        await sendTelegramMessage(
            chatId,
            `Sorry, I couldn't process that request right now.

Please try again in a moment.`
        );
    }
}