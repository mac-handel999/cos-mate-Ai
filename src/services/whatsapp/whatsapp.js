import axios from "axios";
import { env } from "../../config/env.js";

const MAX_WHATSAPP_MEDIA_BYTES = 20 * 1024 * 1024;

function getApiClient() {
    if (!env.whatsappAccessToken || !env.whatsappPhoneNumberId) {
        throw new Error("WhatsApp is not configured. Add the WhatsApp Cloud API environment variables.");
    }

    return axios.create({
        baseURL: `https://graph.facebook.com/${env.whatsappApiVersion}`,
        timeout: 30000,
        headers: {
            Authorization: `Bearer ${env.whatsappAccessToken}`,
            "Content-Type": "application/json"
        }
    });
}

export async function sendWhatsAppText(to, body) {
    const client = getApiClient();
    const response = await client.post(`/${env.whatsappPhoneNumberId}/messages`, {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
            body,
            preview_url: false
        }
    });

    return response.data;
}

export async function downloadWhatsAppMedia(mediaId) {
    const client = getApiClient();
    const metadata = (await client.get(`/${mediaId}`, {
        params: { phone_number_id: env.whatsappPhoneNumberId }
    })).data;

    if (!metadata.url) {
        throw new Error("WhatsApp did not provide a downloadable media URL.");
    }

    if (metadata.file_size && Number(metadata.file_size) > MAX_WHATSAPP_MEDIA_BYTES) {
        throw new Error("That file is too large. Please send a file smaller than 20 MB.");
    }

    const response = await axios.get(metadata.url, {
        responseType: "arraybuffer",
        timeout: 30000,
        headers: { Authorization: `Bearer ${env.whatsappAccessToken}` }
    });

    return {
        buffer: Buffer.from(response.data),
        mimeType: metadata.mime_type
    };
}

export function isWhatsAppConfigured() {
    return Boolean(
        env.whatsappAccessToken &&
        env.whatsappPhoneNumberId &&
        env.whatsappVerifyToken &&
        env.whatsappAppSecret
    );
}
