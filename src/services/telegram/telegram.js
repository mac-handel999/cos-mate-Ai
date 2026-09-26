import axios from "axios";
import { env } from "../../config/env.js";

// Telegram Bot API client using Axios
const telegramApi = axios.create({
    baseURL: `https://api.telegram.org/bot${env.telegramBotToken}`,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json"
    }
});

export async function telegramRequest(method, data = {}) {
    try {
        const response = await telegramApi.post(`/${method}`, data);

        if (!response.data.ok) {
            throw new Error(
                `Telegram API error: ${
                    response.data.description || "Unknown error"
                }`
            );
        }

        return response.data.result;

    } catch (error) {
        if (error.response) {
            console.error("Telegram API response error:", {
                status: error.response.status,
                data: error.response.data
            });

            throw new Error(
                `Telegram API error: ${
                    error.response.data?.description ||
                    error.message
                }`
            );
        }

        if (error.request) {
            throw new Error("Telegram API did not respond.");
        }

        throw error;
    }
}

export async function sendTelegramMessage(chatId, text, options = {}) {
    return telegramRequest("sendMessage", {
        chat_id: chatId,
        text,
        ...(options.parseMode ? { parse_mode: options.parseMode } : {}),
        ...(options.disableWebPagePreview
            ? { link_preview_options: { is_disabled: true } }
            : {})
    });
}

export async function sendTypingAction(chatId) {
    return telegramRequest("sendChatAction", {
        chat_id: chatId,
        action: "typing"
    });
}

export async function sendPhoto(chatId, photo, caption = null) {
    const data = {
        chat_id: chatId,
        photo
    };
    if (caption) data.caption = caption;
    return telegramRequest("sendPhoto", data);
}

export async function sendDocument(chatId, document, caption = null) {
    const data = {
        chat_id: chatId,
        document
    };
    if (caption) data.caption = caption;
    return telegramRequest("sendDocument", data);
}

export async function getFile(fileId) {
    return telegramRequest("getFile", {
        file_id: fileId
    });
}

export async function downloadFile(filePath) {
    const response = await axios.get(
        `https://api.telegram.org/file/bot${env.telegramBotToken}/${filePath}`,
        { responseType: "arraybuffer" }
    );
    return response.data;
}
