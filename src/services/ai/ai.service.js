import { groq } from "./groq.js";

export const AI_MODELS = {
  main: "openai/gpt-oss-120b",
  fast: "openai/gpt-oss-20b",
  vision: "qwen/qwen3.8-27b"
};

export async function askAI({
  messages,
  model = AI_MODELS.main,
  reasoningEffort = "medium",
  maxTokens = 2048
}) {
  if (!messages || !Array.isArray(messages)) {
    throw new Error("AI messages must be an array.");
  }

  const completion = await groq.chat.completions.create({
    model,
    messages,
    reasoning_effort: reasoningEffort,
    max_completion_tokens: maxTokens
  });

  return completion.choices[0]?.message?.content || "";
}

export default { askAI, AI_MODELS };