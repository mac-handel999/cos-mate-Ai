import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { AI_MODELS, askAI } from "../ai/ai.service.js";
import { COS_MATE_SYSTEM_PROMPT } from "../ai/prompts.js";
import { extractPdfText } from "../documents/pdf.service.js";
import {
    saveAssistantMessage,
    startConversationMessage,
    withConversationHistory
} from "../conversations/conversation.service.js";
import { downloadWhatsAppMedia } from "./whatsapp.js";
import { sendWhatsAppMarkdown } from "./whatsapp.format.js";

const MAX_GROQ_IMAGE_BYTES = 14 * 1024 * 1024;

function messagesFromWebhook(payload) {
    return payload.entry?.flatMap((entry) =>
        entry.changes?.flatMap((change) => change.value?.messages || []) || []
    ) || [];
}

export function hasValidWhatsAppSignature(rawBody, signature) {
    if (!env.whatsappAppSecret) return true;
    if (!rawBody || !signature?.startsWith("sha256=")) return false;

    const expected = `sha256=${createHmac("sha256", env.whatsappAppSecret).update(rawBody).digest("hex")}`;
    return expected.length === signature.length &&
        timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function answerWhatsAppImage(message, history) {
    const media = await downloadWhatsAppMedia(message.image.id);

    if (media.buffer.byteLength > MAX_GROQ_IMAGE_BYTES) {
        throw new Error("That image is too large for AI analysis. Please send one smaller than 14 MB.");
    }
    const prompt = message.image.caption?.trim() ||
        "Describe this image for study purposes. Extract important text, explain diagrams, and identify concepts the student should learn.";

    return askAI({
        model: AI_MODELS.vision,
        reasoningEffort: "medium",
        messages: [
            ...withConversationHistory(COS_MATE_SYSTEM_PROMPT, history),
            {
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: `data:${media.mimeType || "image/jpeg"};base64,${media.buffer.toString("base64")}` } }
                ]
            }
        ]
    });
}

async function answerWhatsAppPdf(message, history) {
    const media = await downloadWhatsAppMedia(message.document.id);
    const documentText = await extractPdfText(media.buffer);
    const instruction = message.document.caption?.trim() ||
        "Summarize this study material. Include the main ideas, key terms, and a short revision checklist.";

    return askAI({
        reasoningEffort: "medium",
        messages: [
            ...withConversationHistory(COS_MATE_SYSTEM_PROMPT, history),
            {
                role: "user",
                content: `${instruction}\n\nDocument: ${message.document.filename || "uploaded PDF"}\n\n--- BEGIN DOCUMENT ---\n${documentText}\n--- END DOCUMENT ---`
            }
        ]
    });
}

async function processMessage(message) {
    const messageType = message.type === "image"
        ? "image"
        : message.type === "document" ? "document" : "text";
    const content = message.text?.body || message.image?.caption || message.document?.caption ||
        (messageType === "image" ? "[Image uploaded]" : messageType === "document" ? "[Document uploaded]" : "[Unsupported message]");
    const memory = await startConversationMessage({
        platform: "whatsapp",
        externalUserId: message.from,
        externalChatId: message.from,
        externalMessageId: message.id,
        content,
        messageType,
        metadata: {
            media_id: message.image?.id || message.document?.id || null,
            file_name: message.document?.filename || null,
            mime_type: message.document?.mime_type || null
        }
    });
    const history = memory?.history || [];
    let response;

    if (message.type === "text") {
        response = await askAI({
            reasoningEffort: "medium",
            messages: [
                ...withConversationHistory(COS_MATE_SYSTEM_PROMPT, history),
                { role: "user", content: message.text.body }
            ]
        });
    } else if (message.type === "image") {
        response = await answerWhatsAppImage(message, history);
    } else if (message.type === "document" && message.document.mime_type === "application/pdf") {
        response = await answerWhatsAppPdf(message, history);
    } else {
        await sendWhatsAppMarkdown(message.from, "I currently support text, images, and text-based PDFs.");
        await saveAssistantMessage(memory, "I currently support text, images, and text-based PDFs.");
        return;
    }

    if (!response) throw new Error("AI returned an empty response.");
    await sendWhatsAppMarkdown(message.from, response);
    await saveAssistantMessage(memory, response);
}

export async function handleWhatsAppWebhook(payload) {
    for (const message of messagesFromWebhook(payload)) {
        try {
            await processMessage(message);
        } catch (error) {
            console.error("WhatsApp message processing failed:", error);
            await sendWhatsAppMarkdown(
                message.from,
                "Sorry, I couldn't process that request right now. Please try again in a moment."
            );
        }
    }
}
