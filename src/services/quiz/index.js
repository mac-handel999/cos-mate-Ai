import AIService from '../ai/aiService.js';

class QuizService extends AIService {
  constructor() {
    super();
    this.quizzes = new Map();
  }

  createQuiz(title, questions = []) {
    const quiz = {
      id: this.generateId(),
      title,
      questions,
      createdAt: new Date(),
    };
    this.quizzes.set(quiz.id, quiz);
    return quiz;
  }

  getQuiz(quizId) {
    return this.quizzes.get(quizId);
  }

  getAllQuizzes() {
    return Array.from(this.quizzes.values());
  }

  async generateQuizFromContent(content, questionCount = 5, title = 'Generated Quiz') {
    const questions = await this.generateQuiz(content, questionCount);
    return this.createQuiz(title, questions);
  }

  evaluateQuiz(quizId, userAnswers) {
    const quiz = this.getQuiz(quizId);
    if (!quiz) throw new Error('Quiz not found');

    let score = 0;
    const results = quiz.questions.map((question, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) score++;
      
      return {
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
      };
    });

    return {
      score,
      total: quiz.questions.length,
      percentage: Math.round((score / quiz.questions.length) * 100),
      results,
    };
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
}

export default QuizService;