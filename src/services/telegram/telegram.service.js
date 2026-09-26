import {
    downloadFile,
    getFile,
    sendTelegramMessage,
    sendTelegramTextDocument,
    sendTypingAction
} from "./telegram.js";
import { AI_MODELS, askAI } from "../ai/ai.service.js";
import { generateCbtQuestionBank, requestedCbtQuestionCount } from "../ai/cbt.service.js";
import { COS_MATE_SYSTEM_PROMPT } from "../ai/prompts.js";
import { extractPdfText } from "../documents/pdf.service.js";
import { sendTelegramMarkdown } from "./telegram.format.js";
import {
    saveAssistantMessage,
    startConversationMessage,
    withConversationHistory
} from "../conversations/conversation.service.js";

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

async function answerImage(message, history) {
    const photo = getLargestPhoto(message) || message.document;
    const image = await downloadTelegramFile(photo);

    if (image.byteLength > MAX_GROQ_IMAGE_BYTES) {
        throw new Error("That image is too large for AI analysis. Please send one smaller than 14 MB.");
    }

    const mimeType = message.document?.mime_type || "image/jpeg";
    const prompt = message.caption?.trim() ||
        "Describe this image for study purposes. Extract any important text, explain diagrams, and identify concepts the student should learn.";

    const requestedCount = requestedCbtQuestionCount(prompt);

    if (requestedCount) {
        const courseOutline = await askAI({
            model: AI_MODELS.vision,
            reasoningEffort: "medium",
            maxTokens: 4096,
            messages: [
                ...withConversationHistory(COS_MATE_SYSTEM_PROMPT, history),
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Extract the complete course outline, topics, and subtopics from this image. Preserve the scope accurately. Do not generate questions yet."
                        },
                        {
                            type: "image_url",
                            image_url: { url: `data:${mimeType};base64,${Buffer.from(image).toString("base64")}` }
                        }
                    ]
                }
            ]
        });

        return {
            document: true,
            questionCount: requestedCount,
            text: await generateCbtQuestionBank({
                source: courseOutline,
                questionCount: requestedCount,
                history
            })
        };
    }

    return askAI({
        model: AI_MODELS.vision,
        reasoningEffort: "medium",
        messages: [
            ...withConversationHistory(COS_MATE_SYSTEM_PROMPT, history),
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

async function answerPdf(message, history) {
    const document = message.document;
    const pdf = await downloadTelegramFile(document);
    const documentText = await extractPdfText(Buffer.from(pdf));
    const instruction = message.caption?.trim() ||
        "Summarize this study material. Include the main ideas, key terms, and a short revision checklist.";
    const requestedCount = requestedCbtQuestionCount(instruction);

    if (requestedCount) {
        return {
            document: true,
            questionCount: requestedCount,
            text: await generateCbtQuestionBank({
                source: documentText,
                questionCount: requestedCount,
                history
            })
        };
    }

    return askAI({
        reasoningEffort: "medium",
        messages: [
            ...withConversationHistory(COS_MATE_SYSTEM_PROMPT, history),
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
    const messageType = message.photo || message.document?.mime_type?.startsWith("image/")
        ? "image"
        : message.document?.mime_type === "application/pdf"
            ? "document"
            : "text";
    const content = text || message.caption?.trim() ||
        (messageType === "image" ? "[Image uploaded]" : messageType === "document" ? "[PDF uploaded]" : "[Unsupported message]");
    const memory = await startConversationMessage({
        platform: "telegram",
        externalUserId: message.from.id,
        externalChatId: chatId,
        externalMessageId: message.message_id,
        profile: {
            username: message.from.username,
            firstName: message.from.first_name,
            lastName: message.from.last_name
        },
        content,
        messageType,
        metadata: {
            update_id: update.update_id,
            file_id: getLargestPhoto(message)?.file_id || message.document?.file_id || null,
            file_name: message.document?.file_name || null,
            mime_type: message.document?.mime_type || null
        }
    });
    const history = memory?.history || [];

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
        await saveAssistantMessage(memory, "Welcome message sent.");

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
        await saveAssistantMessage(memory, "Help message sent.");

        return;
    }

    try {
        await sendTypingAction(chatId);

        let response;

        if (message.photo || message.document?.mime_type?.startsWith("image/")) {
            response = await answerImage(message, history);
        } else if (message.document?.mime_type === "application/pdf") {
            response = await answerPdf(message, history);
        } else if (text) {
            const requestedCount = requestedCbtQuestionCount(text);

            if (requestedCount) {
                response = {
                    document: true,
                    questionCount: requestedCount,
                    text: await generateCbtQuestionBank({
                        source: text,
                        questionCount: requestedCount,
                        history
                    })
                };
            } else {
            response = await askAI({
                messages: [
                    ...withConversationHistory(COS_MATE_SYSTEM_PROMPT, history),
                    { role: "user", content: text }
                ],
                reasoningEffort: "medium"
            });
            }
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

        const responseText = typeof response === "string" ? response : response?.text;

        if (!responseText) {
            throw new Error("AI returned an empty response.");
        }

        if (response.document) {
            await sendTelegramTextDocument(chatId, responseText, `cos-mate-${response.questionCount}-cbt-questions.txt`);
            await sendTelegramMessage(
                chatId,
                `Your complete ${response.questionCount}-question CBT set is attached as one copy-friendly text document.`
            );
        } else {
            await sendTelegramMarkdown(chatId, responseText);
        }

        await saveAssistantMessage(memory, responseText, {
            generated_cbt_questions: response.document ? response.questionCount : null
        });

    } catch (error) {
        console.error("COS MATE AI error:", error);

        await sendTelegramMessage(
            chatId,
            `Sorry, I couldn't process that request right now.

Please try again in a moment.`
        );
        await saveAssistantMessage(memory, "Sorry, I couldn't process that request right now.", { error: true });
    }
}
