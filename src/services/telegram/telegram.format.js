import { sendTelegramMessage } from "./telegram.js";

const SAFE_MESSAGE_LENGTH = 3500;

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

/**
 * Telegram supports a deliberately small subset of HTML. Convert the common
 * Markdown that the model returns into that subset instead of passing raw
 * Markdown through and risking an invalid Telegram entity error.
 */
export function markdownToTelegramHtml(markdown) {
    const codeBlocks = [];
    let html = escapeHtml(markdown.trim());

    html = html.replace(/```[^\n]*\n?([\s\S]*?)```/g, (_, code) => {
        const token = `\u0000CODE_BLOCK_${codeBlocks.length}\u0000`;
        codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
        return token;
    });

    html = html
        .replace(/^#{1,6}\s+(.+)$/gm, "<b>$1</b>")
        .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
        .replace(/__(.+?)__/g, "<b>$1</b>")
        .replace(/`([^`\n]+)`/g, "<code>$1</code>")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');

    return html.replace(/\u0000CODE_BLOCK_(\d+)\u0000/g, (_, index) => {
        return codeBlocks[Number(index)];
    });
}

export function splitTelegramMessage(text) {
    const chunks = [];
    let remaining = text.trim();

    while (remaining.length > SAFE_MESSAGE_LENGTH) {
        let splitAt = remaining.lastIndexOf("\n", SAFE_MESSAGE_LENGTH);

        if (splitAt < SAFE_MESSAGE_LENGTH / 2) {
            splitAt = remaining.lastIndexOf(" ", SAFE_MESSAGE_LENGTH);
        }

        if (splitAt < 1) {
            splitAt = SAFE_MESSAGE_LENGTH;
        }

        chunks.push(remaining.slice(0, splitAt).trim());
        remaining = remaining.slice(splitAt).trim();
    }

    if (remaining) {
        chunks.push(remaining);
    }

    return chunks.length ? chunks : ["I couldn't generate a response."];
}

export async function sendTelegramMarkdown(chatId, markdown) {
    for (const chunk of splitTelegramMessage(markdown)) {
        const html = markdownToTelegramHtml(chunk);

        // Keep the response available even if a model-generated entity is not
        // accepted by Telegram's HTML parser.
        try {
            await sendTelegramMessage(chatId, html, {
                parseMode: "HTML",
                disableWebPagePreview: true
            });
        } catch (error) {
            console.warn("Telegram HTML formatting failed; sending plain text.", error.message);
            await sendTelegramMessage(chatId, chunk, {
                disableWebPagePreview: true
            });
        }
    }
}
