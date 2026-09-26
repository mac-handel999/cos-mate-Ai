import { sendWhatsAppText } from "./whatsapp.js";

const SAFE_MESSAGE_LENGTH = 3500;

export function formatWhatsAppMarkdown(markdown) {
    return markdown
        .trim()
        .replace(/^#{1,6}\s+(.+)$/gm, "*$1*")
        .replace(/\*\*(.+?)\*\*/g, "*$1*")
        .replace(/__(.+?)__/g, "*$1*");
}

export function splitWhatsAppMessage(text) {
    const chunks = [];
    let remaining = text.trim();

    while (remaining.length > SAFE_MESSAGE_LENGTH) {
        let splitAt = remaining.lastIndexOf("\n", SAFE_MESSAGE_LENGTH);
        if (splitAt < SAFE_MESSAGE_LENGTH / 2) splitAt = remaining.lastIndexOf(" ", SAFE_MESSAGE_LENGTH);
        if (splitAt < 1) splitAt = SAFE_MESSAGE_LENGTH;
        chunks.push(remaining.slice(0, splitAt).trim());
        remaining = remaining.slice(splitAt).trim();
    }

    if (remaining) chunks.push(remaining);
    return chunks.length ? chunks : ["I couldn't generate a response."];
}

export async function sendWhatsAppMarkdown(to, markdown) {
    for (const chunk of splitWhatsAppMessage(formatWhatsAppMarkdown(markdown))) {
        await sendWhatsAppText(to, chunk);
    }
}
