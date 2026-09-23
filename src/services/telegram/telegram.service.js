import { sendTelegramMessage } from "./telegram.js";

export async function handleTelegramUpdate(update) {
  if (!update.message) {
    return;
  }

  const message = update.message;

  const chatId = message.chat.id;
  const text = message.text || "";

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

Send me a question to get started.`
    );

    return;
  }

  if (text === "/help") {
    await sendTelegramMessage(
      chatId,
      `📚 COS MATE Help

/start - Start COS MATE
/help - Show help
/ask - Ask a question
/summarize - Summarize material
/quiz - Generate a CBT quiz`
    );

    return;
  }

  if (text) {
    await sendTelegramMessage(
      chatId,
      `I received:

"${text}"

🤖 AI processing will be connected next.`
    );
  }
}