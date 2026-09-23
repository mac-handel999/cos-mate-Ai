import { env } from "../../config/env.js";

const TELEGRAM_API =
  `https://api.telegram.org/bot${env.telegramBotToken}`;

export async function telegramRequest(method, body = {}) {
  const response = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(
      `Telegram API error: ${data.description || "Unknown error"}`
    );
  }

  return data.result;
}

export async function sendTelegramMessage(chatId, text) {
  return telegramRequest("sendMessage", {
    chat_id: chatId,
    text
  });
}