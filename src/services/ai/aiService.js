import { config } from '../../config/env.js';

class AIService {
  constructor() {
    this.apiKey = config.groq.apiKey;
    this.model = config.groq.model;
    this.temperature = config.groq.temperature;
    this.maxTokens = config.groq.maxTokens;
  }

  async generateResponse(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    try {
      // Dynamic import for node-fetch
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature ?? this.temperature,
          max_tokens: options.maxTokens ?? this.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async analyzeDocument(content, analysisType = 'summary') {
    const prompts = {
      summary: `Please provide a comprehensive summary of the following content:\n\n${content}`,
      questions: `Generate 5 study questions based on this content:\n\n${content}`,
      keyPoints: `Extract the key points from this content:\n\n${content}`,
    };

    return this.generateResponse(prompts[analysisType] || prompts.summary);
  }

  async generateQuiz(content, questionCount = 5) {
    const prompt = `Generate ${questionCount} multiple-choice questions based on this content. Format each question with options and indicate the correct answer:\n\n${content}`;
    return this.generateResponse(prompt);
  }
}

export default AIService;