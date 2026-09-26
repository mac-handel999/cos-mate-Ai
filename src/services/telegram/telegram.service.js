import {
    downloadFile,
    getFile,
    sendTelegramMessage,
    sendTypingAction
} from "./telegram.js";
import { AI_MODELS, askAI } from "../ai/ai.service.js";
import { COS_MATE_SYSTEM_PROMPT } from "../ai/prompts.js";
import { extractPdfText } from "../documents/pdf.service.js";
import { sendTelegramMarkdown } from "./telegram.format.js";

const MAX_TELEGRAM_DOWNLOAD_BYTES = 20 * 1024 * 1024;
const MAX_GROQ_IMAGE_BYTES = 14 * 1024 * 1024;

function getLargestPhoto(message) {
    return message.photo?.[message.photo.length - 1];
}

function assertFileSize(file) {
    if (file.file_size && file.file_size > MAX_TELEGRAM_DOWNLOAD_BYTES) {
        throw new Error("That file is too large. Please send a file smaller than 20 MB.");
    }
}

async function downloadTelegramFile(file) {
    assertFileSize(file);
    const telegramFile = await getFile(file.file_id);
    assertFileSize(telegramFile);

    if (!telegramFile.file_path) {
        throw new Error("Telegram did not provide a downloadable file path.");
    }

    return downloadFile(telegramFile.file_path);
}

async function answerImage(message) {
    const photo = getLargestPhoto(message) || message.document;
    const image = await downloadTelegramFile(photo);

    if (image.byteLength > MAX_GROQ_IMAGE_BYTES) {
        throw new Error("That image is too large for AI analysis. Please send one smaller than 14 MB.");
    }

    const mimeType = message.document?.mime_type || "image/jpeg";
    const prompt = message.caption?.trim() ||
        "Describe this image for study purposes. Extract any important text, explain diagrams, and identify concepts the student should learn.";

    return askAI({
        model: AI_MODELS.vision,
        reasoningEffort: "medium",
        messages: [
            { role: "system", content: COS_MATE_SYSTEM_PROMPT },
            {
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${mimeType};base64,${Buffer.from(image).toString("base64")}`
                        }
                    }
                ]
            }
        ]
    });
}

async function answerPdf(message) {
    const document = message.document;
    const pdf = await downloadTelegramFile(document);
    const documentText = await extractPdfText(Buffer.from(pdf));
    const instruction = message.caption?.trim() ||
        "Summarize this study material. Include the main ideas, key terms, and a short revision checklist.";

    return askAI({
        reasoningEffort: "medium",
        messages: [
            { role: "system", content: COS_MATE_SYSTEM_PROMPT },
            {
                role: "user",
                content: `${instruction}\n\nDocument: ${document.file_name || "uploaded PDF"}\n\n--- BEGIN DOCUMENT ---\n${documentText}\n--- END DOCUMENT ---`
            }
        ]
    });
}

export async function handleTelegramUpdate(update) {
    if (!update.message) {
        return;
    }

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text?.trim() || "";

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
• A photo of notes, a diagram, or a question
• A text-based PDF for summarization or revision
• A request for CBT questions

Commands:

/start - Start COS MATE
/help - Show this help

Please keep uploaded files below 20 MB. 🚀`
        );

        return;
    }

    try {
        await sendTypingAction(chatId);

        let response;

        if (message.photo || message.document?.mime_type?.startsWith("image/")) {
            response = await answerImage(message);
        } else if (message.document?.mime_type === "application/pdf") {
            response = await answerPdf(message);
        } else if (text) {
            response = await askAI({
                messages: [
                    { role: "system", content: COS_MATE_SYSTEM_PROMPT },
                    { role: "user", content: text }
                ],
                reasoningEffort: "medium"
            });
        } else if (message.document) {
            await sendTelegramMessage(
                chatId,
                "I currently support images and text-based PDFs. Please send one of those formats."
            );
            return;
        } else {
            await sendTelegramMessage(
                chatId,
                "Please send a study question, an image, or a text-based PDF."
            );
            return;
        }

        if (!response) {
            throw new Error("AI returned an empty response.");
        }

        await sendTelegramMarkdown(chatId, response);

    } catch (error) {
        console.error("COS MATE AI error:", error);

        await sendTelegramMessage(
            chatId,
            `Sorry, I couldn't process that request right now.

Please try again in a moment.`
        );
    }
}
