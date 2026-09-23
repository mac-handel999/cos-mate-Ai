import { groq } from "./groq.js";
import { PROMPTS } from "./prompts.js";

// Model configuration - single source of truth for all model IDs
const MODELS = {
  main: "openai/gpt-oss-120b",
  fast: "openai/gpt-oss-20b",
  vision: "qwen/qwen3.8-27b"
};

// Default parameters
const DEFAULTS = {
  temperature: 0.7,
  maxTokens: 2048
};

/**
 * Core AI request function - all AI capabilities route through this
 */
export async function askAI({
  messages,
  model = MODELS.main,
  temperature = DEFAULTS.temperature,
  maxTokens = DEFAULTS.maxTokens,
  responseFormat = null,
  jsonMode = false
}) {
  try {
    const options = {
      model,
      messages,
      temperature,
      max_completion_tokens: maxTokens
    };

    // Support structured JSON output
    if (responseFormat === "json" || jsonMode) {
      options.response_format = { type: "json_object" };
    }

    const completion = await groq.chat.completions.create(options);
    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("AI Service Error:", error);
    throw new Error(`AI request failed: ${error.message}`);
  }
}

/**
 * Ask a general study question
 */
export async function askQuestion(question, level = "university") {
  const response = await askAI({
    messages: [
      { role: "system", content: PROMPTS.system.tutor },
      { role: "user", content: PROMPTS.askQuestion(question, level) }
    ]
  });
  return response;
}

/**
 * Explain a specific topic
 */
export async function explainTopic(topic, level = "university") {
  const response = await askAI({
    messages: [
      { role: "system", content: PROMPTS.system.tutor },
      { role: "user", content: PROMPTS.explainTopic(topic, level) }
    ]
  });
  return response;
}

/**
 * Summarize text
 */
export async function summarizeText(text, maxLength = "medium") {
  const response = await askAI({
    messages: [
      { role: "system", content: PROMPTS.system.tutor },
      { role: "user", content: PROMPTS.summarizeText(text, maxLength) }
    ]
  });
  return response;
}

/**
 * Generate CBT questions with structured JSON output
 */
export async function generateQuiz(content, questionCount = 5, difficulty = "medium") {
  const response = await askAI({
    messages: [
      { role: "system", content: PROMPTS.system.examiner },
      { role: "user", content: PROMPTS.generateQuiz(content, questionCount, difficulty) }
    ],
    model: MODELS.main,
    jsonMode: true
  });

  try {
    // Parse the JSON response
    const quizData = JSON.parse(response);
    return quizData;
  } catch (error) {
    console.error("Failed to parse quiz JSON:", error);
    // Fallback: return raw response
    return { raw: response, error: "Failed to parse structured quiz" };
  }
}

/**
 * Grade a quiz with structured feedback
 */
export async function gradeQuiz(questions, userAnswers) {
  const response = await askAI({
    messages: [
      { role: "system", content: PROMPTS.system.grader },
      { role: "user", content: PROMPTS.gradeQuiz(questions, userAnswers) }
    ],
    model: MODELS.fast,
    jsonMode: true
  });

  try {
    const gradeData = JSON.parse(response);
    return gradeData;
  } catch (error) {
    console.error("Failed to parse grade JSON:", error);
    return { raw: response, error: "Failed to parse structured grade" };
  }
}

/**
 * Analyze image(s) - uses vision model
 */
export async function analyzeImage(question, imageBase64Array = []) {
  const messages = [
    { role: "system", content: PROMPTS.system.tutor }
  ];

  // Build multimodal message with images
  const userContent = [
    { type: "text", text: PROMPTS.analyzeImage(question, imageBase64Array.length) }
  ];

  // Add images to the message
  for (const imageBase64 of imageBase64Array) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${imageBase64}`
      }
    });
  }

  messages.push({ role: "user", content: userContent });

  const response = await askAI({
    messages,
    model: MODELS.vision,
    maxTokens: 2048
  });

  return response;
}

/**
 * Answer questions based on document context (RAG)
 */
export async function answerFromDocument(question, context) {
  const response = await askAI({
    messages: [
      { role: "system", content: PROMPTS.system.tutor },
      { role: "user", content: PROMPTS.answerFromDocument(question, context) }
    ]
  });
  return response;
}

/**
 * Extract text from image (OCR-style)
 */
export async function extractTextFromImage(imageBase64Array = []) {
  const messages = [
    { role: "system", content: PROMPTS.system.tutor }
  ];

  const userContent = [
    { type: "text", text: PROMPTS.extractText() }
  ];

  for (const imageBase64 of imageBase64Array) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${imageBase64}`
      }
    });
  }

  messages.push({ role: "user", content: userContent });

  const response = await askAI({
    messages,
    model: MODELS.vision,
    maxTokens: 2048
  });

  return response;
}

// Export model configuration for reference
export { MODELS };

export default {
  askAI,
  askQuestion,
  explainTopic,
  summarizeText,
  generateQuiz,
  gradeQuiz,
  analyzeImage,
  answerFromDocument,
  extractTextFromImage,
  MODELS
};