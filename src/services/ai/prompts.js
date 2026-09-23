// COS MATE AI Prompts
// Centralized prompt templates for different AI tasks

export const PROMPTS = {
  // System prompts
  system: {
    tutor: "You are COS MATE, an AI study companion for Nigerian university students. You explain concepts clearly, use relatable examples, and adapt your explanations to the student's level.",
    examiner: "You are an AI exam generator. Generate high-quality, academically rigorous questions that test understanding, not just memorization.",
    grader: "You are an AI grader. Evaluate student answers fairly and provide constructive feedback."
  },

  // Question answering
  askQuestion: (question, level = "university") => 
    `Explain the following to a ${level} Nigerian university student:\n\n${question}`,

  // Topic explanation
  explainTopic: (topic, level = "university") =>
    `Explain "${topic}" to a ${level} Nigerian university student. Use clear examples and analogies that would resonate with a Nigerian student.`,

  // Summarization
  summarizeText: (text, maxLength = "medium") =>
    `Summarize the following text for a Nigerian university student. Make it ${maxLength} length and capture all key points:\n\n${text}`,

  // CBT Generation
  generateQuiz: (content, questionCount = 5, difficulty = "medium") => 
    `Generate ${questionCount} multiple-choice questions from the following study material. 
    Difficulty level: ${difficulty}
    Each question should have 4 options (A, B, C, D) with one correct answer and a brief explanation.
    
    Return the response as a JSON object with this exact structure:
    {
      "title": "Generated Quiz",
      "questions": [
        {
          "question": "The question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Why this is correct"
        }
      ]
    }
    
    Study material:
    ${content}`,

  // CBT Grading
  gradeQuiz: (questions, userAnswers) => 
    `Grade the following quiz. For each question, determine if the answer is correct and provide feedback.
    
    Questions and user answers:
    ${JSON.stringify({ questions, userAnswers })}
    
    Return a JSON object with this structure:
    {
      "score": number,
      "total": number,
      "feedback": [
        {
          "questionIndex": number,
          "isCorrect": boolean,
          "explanation": "Feedback for this answer"
        }
      ]
    }`,

  // Image analysis
  analyzeImage: (question, imageCount = 1) =>
    `Analyze the image(s) and answer the following question: ${question}
    
    If the image contains a question (math, physics, chemistry, etc.), solve it step by step.
    If it contains notes or text, extract the key points and summarize.
    
    Be helpful and explain your reasoning clearly.`,

  // Document Q&A
  answerFromDocument: (question, context) =>
    `Based on the following study material, answer this question:
    
    Question: ${question}
    
    Study material:
    ${context}
    
    If the answer is not in the material, say so and provide general guidance on where to find it.`,

  // OCR extraction
  extractText: () =>
    `Extract all the text from this image. If it contains a question, identify the subject (math, physics, chemistry, biology, etc.) and format the extracted text clearly.`
};

export default PROMPTS;