import { AI_MODELS, askAI } from "./ai.service.js";
import { COS_MATE_SYSTEM_PROMPT } from "./prompts.js";

const MAX_CBT_QUESTIONS = 150;
const QUESTIONS_PER_BATCH = 15;

export function requestedCbtQuestionCount(text = "") {
    const match = text.match(/\b(?:generate|create|make|give)\s+(\d{1,3})\s+(?:cbt|mcq|multiple[- ]choice|objective)?\s*questions?\b/i) ||
        text.match(/\b(\d{1,3})\s+(?:cbt|mcq|multiple[- ]choice|objective)\s+questions?\b/i);

    if (!match) return null;
    return Math.min(Math.max(Number(match[1]), 1), MAX_CBT_QUESTIONS);
}

function isCompleteBatch(response, start, end) {
    const answerCount = (response.match(/^\s*Answer\s*:/gim) || []).length;
    const hasEveryQuestion = Array.from({ length: end - start + 1 }, (_, offset) => start + offset)
        .every((number) => new RegExp(`^\\s*(?:Question\\s+)?${number}[.):]`, "im").test(response));

    return hasEveryQuestion && answerCount === end - start + 1;
}

export async function generateCbtQuestionBank({ source, questionCount, history = [] }) {
    const batches = [];

    for (let start = 1; start <= questionCount; start += QUESTIONS_PER_BATCH) {
        const end = Math.min(start + QUESTIONS_PER_BATCH - 1, questionCount);
        const count = end - start + 1;
        let response = "";

        // A retry prevents an incomplete trailing question from being sent.
        for (let attempt = 0; attempt < 2; attempt += 1) {
            response = await askAI({
                model: AI_MODELS.main,
                reasoningEffort: "medium",
                maxTokens: 4096,
                messages: [
                    { role: "system", content: COS_MATE_SYSTEM_PROMPT },
                    ...history.slice(-6),
                    {
                        role: "user",
                        content: `Create exactly ${count} CBT multiple-choice questions numbered ${start} through ${end}, based only on the course material below.\n\nUse this exact structure for every item:\n${start}. Question text\nA. option\nB. option\nC. option\nD. option\nAnswer: letter — answer text\n\nDo not omit a question, option, or Answer line. Do not add an introduction, summary, table, or text outside the requested questions.\n\n--- COURSE MATERIAL ---\n${source}\n--- END COURSE MATERIAL ---`
                    }
                ]
            });

            if (response && isCompleteBatch(response, start, end)) break;
        }

        if (!response || !isCompleteBatch(response, start, end)) {
            throw new Error(`AI returned an incomplete CBT batch for questions ${start}-${end}.`);
        }

        batches.push(response.trim());
    }

    return batches.join("\n\n");
}
