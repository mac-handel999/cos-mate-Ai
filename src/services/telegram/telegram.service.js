import { sendTelegramMessage } from "./telegram.js";
import { askQuestion, summarizeText, generateQuiz } from "../ai/ai.service.js";

export async function handleTelegramUpdate(update) {
  if (!update.message) {
    return;
  }

  const message = update.message;

  const chatId = message.chat.id;
  const text = message.text || "";

  // Handle /start command
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

  // Handle /help command
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

  // Handle /ask command
  if (text.startsWith("/ask ")) {
    const question = text.replace("/ask ", "");
    try {
      await sendTelegramMessage(chatId, "🤖 Thinking...");
      const response = await askQuestion(question);
      await sendTelegramMessage(chatId, response);
    } catch (error) {
      console.error("AI Error:", error);
      await sendTelegramMessage(chatId, "❌ Sorry, I couldn't process that question. Please try again.");
    }
    return;
  }

  // Handle /summarize command
  if (text.startsWith("/summarize ")) {
    const content = text.replace("/summarize ", "");
    try {
      await sendTelegramMessage(chatId, "🤖 Summarizing...");
      const response = await summarizeText(content);
      await sendTelegramMessage(chatId, response);
    } catch (error) {
      console.error("AI Error:", error);
      await sendTelegramMessage(chatId, "❌ Sorry, I couldn't summarize that content. Please try again.");
    }
    return;
  }

  // Handle /quiz command
  if (text.startsWith("/quiz ")) {
    const content = text.replace("/quiz ", "");
    try {
      await sendTelegramMessage(chatId, "🤖 Generating quiz...");
      const quiz = await generateQuiz(content, 3, "medium");
      if (quiz.raw) {
        await sendTelegramMessage(chatId, "❌ Failed to generate structured quiz. Here's the raw response:\n\n" + quiz.raw);
      } else {
        let quizText = `📝 *${quiz.title}*\n\n`;
        quiz.questions.forEach((q, i) => {
          quizText += `${i + 1}. ${q.question}\n`;
          q.options.forEach((opt, j) => {
            const marker = j === q.correctAnswer ? "✅" : "  ";
            quizText += `${marker} ${String.fromCharCode(65 + j)}. ${opt}\n`;
          });
          quizText += `\n`;
        });
        await sendTelegramMessage(chatId, quizText);
      }
    } catch (error) {
      console.error("AI Error:", error);
      await sendTelegramMessage(chatId, "❌ Sorry, I couldn't generate a quiz. Please try again.");
    }
    return;
  }

  // Default: treat as a study question
  if (text) {
    try {
      await sendTelegramMessage(chatId, "🤖 Thinking...");
      const response = await askQuestion(text);
      await sendTelegramMessage(chatId, response);
    } catch (error) {
      console.error("AI Error:", error);
      await sendTelegramMessage(chatId, "❌ Sorry, I couldn't process that. Please try again or use /help for commands.");
    }
  }
}