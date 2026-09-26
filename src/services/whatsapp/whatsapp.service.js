import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { AI_MODELS, askAI } from "../ai/ai.service.js";
import { COS_MATE_SYSTEM_PROMPT } from "../ai/prompts.js";
import { extractPdfText } from "../documents/pdf.service.js";
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

async function answerWhatsAppImage(message) {
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
            { role: "system", content: COS_MATE_SYSTEM_PROMPT },
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

async function answerWhatsAppPdf(message) {
    const media = await downloadWhatsAppMedia(message.document.id);
    const documentText = await extractPdfText(media.buffer);
    const instruction = message.document.caption?.trim() ||
        "Summarize this study material. Include the main ideas, key terms, and a short revision checklist.";

    return askAI({
        reasoningEffort: "medium",
        messages: [
            { role: "system", content: COS_MATE_SYSTEM_PROMPT },
            {
                role: "user",
                content: `${instruction}\n\nDocument: ${message.document.filename || "uploaded PDF"}\n\n--- BEGIN DOCUMENT ---\n${documentText}\n--- END DOCUMENT ---`
            }
        ]
    });
}

async function processMessage(message) {
    let response;

    if (message.type === "text") {
        response = await askAI({
            reasoningEffort: "medium",
            messages: [
                { role: "system", content: COS_MATE_SYSTEM_PROMPT },
                { role: "user", content: message.text.body }
            ]
        });
    } else if (message.type === "image") {
        response = await answerWhatsAppImage(message);
    } else if (message.type === "document" && message.document.mime_type === "application/pdf") {
        response = await answerWhatsAppPdf(message);
    } else {
        await sendWhatsAppMarkdown(message.from, "I currently support text, images, and text-based PDFs.");
        return;
    }

    if (!response) throw new Error("AI returned an empty response.");
    await sendWhatsAppMarkdown(message.from, response);
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
