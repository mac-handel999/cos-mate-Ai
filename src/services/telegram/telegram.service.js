import { sendTelegramMessage, sendTypingAction } from "./telegram.js";
import { askAI } from "../ai/ai.service.js";
import { analyzeImage } from "../ai/ai.service.js";
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

    // Handle /start command
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

    // Handle /help command
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

    // Check if message has photo/image
    const hasImage = message.photo && message.photo.length > 0;
    const hasDocument = message.document;

    // If no text and no image/document, show help
    if (!text && !hasImage && !hasDocument) {
        await sendTelegramMessage(
            chatId,
            "I can currently understand text messages. Image and PDF support is coming next. 📚"
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
                messageType: hasImage ? "image" : hasDocument ? "document" : "text",
                text: text || (hasImage ? "[Image message]" : "[Document message]")
            });

            // Step 4: Build AI context from conversation history
            contextMessages = await buildChatContext(conversation.id, 12);

        } catch (supabaseError) {
            console.warn("Supabase unavailable, continuing without memory:", supabaseError.message);
        }

        // Step 5: Get AI response
        let response;
        const userMessage = text || "Please analyze this image/document for study purposes.";

        // Check if message contains image or document
        if (hasImage) {
            // Handle image - use vision model
            response = await analyzeImage(userMessage, []);
        } else if (hasDocument) {
            // Handle document - use main model with text
            response = await askAI({
                messages: [
                    {
                        role: "system",
                        content: COS_MATE_SYSTEM_PROMPT
                    },
                    ...contextMessages,
                    {
                        role: "user",
                        content: `${userMessage}\n\n[Document: ${message.document.file_name || "uploaded file"}]`
                    }
                ],
                reasoningEffort: "medium"
            });
        } else {
            // Regular text message
            response = await askAI({
                messages: [
                    {
                        role: "system",
                        content: COS_MATE_SYSTEM_PROMPT
                    },
                    ...contextMessages,
                    {
                        role: "user",
                        content: userMessage
                    }
                ],
                reasoningEffort: "medium"
            });
        }

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

        // Check if it's a rate limit error
        const isRateLimit = error.message?.includes("rate limit") ||
                            error.message?.includes("Rate limit") ||
                            error.message?.includes("429") ||
                            error.message?.includes("Too Many Requests");

        const errorMessage = isRateLimit
            ? `⚠️ AI service is currently rate limited. This happens when too many requests are made at once.

Please wait a moment and try again. The limit resets automatically.`
            : `Sorry, I couldn't process that request right now.

Please try again in a moment.`;

        await sendTelegramMessage(chatId, errorMessage);
    }
}