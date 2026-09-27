import { env } from "../../config/env.js";
import { askAI } from "../ai/ai.service.js";
import { COS_MATE_SYSTEM_PROMPT } from "../ai/prompts.js";
import { findOrCreateUser } from "../users/user.service.js";
import { getOrCreateConversation } from "../conversations/conversation.service.js";
import { saveMessage, getRecentMessages } from "../memory/memory.service.js";
import { buildChatContext } from "../ai/context.service.js";

// WhatsApp webhook handler
export async function handleWhatsAppWebhook(payload) {
    const messages = payload.entry?.flatMap((entry) =>
        entry.changes?.flatMap((change) => change.value?.messages || []) || []
    ) || [];

    for (const message of messages) {
        try {
            await processWhatsAppMessage(message);
        } catch (error) {
            console.error("WhatsApp message processing failed:", error);
        }
    }
}

async function processWhatsAppMessage(message) {
    const chatId = message.from;
    const text = message.text?.body || "";
    const messageType = message.type === "image" ? "image" :
                       message.type === "document" ? "document" : "text";

    if (!text && messageType === "text") {
        return;
    }

    // Find or create user
    const user = await findOrCreateUser({
        platform: "whatsapp",
        externalUserId: chatId,
        displayName: null
    });

    // Get or create conversation
    const conversation = await getOrCreateConversation({
        userId: user.id,
        platform: "whatsapp",
        externalChatId: chatId
    });

    // Save user message
    await saveMessage({
        conversationId: conversation.id,
        platformMessageId: message.id,
        senderType: "user",
        messageType,
        text: text || `[${messageType} message]`
    });

    // Build context
    const contextMessages = await buildChatContext(conversation.id, 12);

    // Get AI response
    const response = await askAI({
        messages: [
            { role: "system", content: COS_MATE_SYSTEM_PROMPT },
            ...contextMessages
        ],
        reasoningEffort: "medium"
    });

    if (!response) {
        throw new Error("AI returned an empty response.");
    }

    // Save AI response
    await saveMessage({
        conversationId: conversation.id,
        senderType: "assistant",
        messageType: "text",
        text: response
    });

    return response;
}

export default { handleWhatsAppWebhook };