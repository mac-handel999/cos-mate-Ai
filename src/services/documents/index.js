import AIService from '../ai/aiService.js';

class DocumentsService extends AIService {
  constructor() {
    super();
    this.documents = new Map();
  }

  addDocument(title, content, metadata = {}) {
    const document = {
      id: this.generateId(),
      title,
      content,
      metadata,
      createdAt: new Date(),
    };
    this.documents.set(document.id, document);
    return document;
  }

  getDocument(documentId) {
    return this.documents.get(documentId);
  }

  getAllDocuments() {
    return Array.from(this.documents.values());
  }

  deleteDocument(documentId) {
    return this.documents.delete(documentId);
  }

  async summarizeDocument(documentId, summaryType = 'summary') {
    const document = this.getDocument(documentId);
    if (!document) throw new Error('Document not found');
    
    return this.analyzeDocument(document.content, summaryType);
  }

  async generateQuestions(documentId, questionCount = 5) {
    const document = this.getDocument(documentId);
    if (!document) throw new Error('Document not found');
    
    return this.generateQuiz(document.content, questionCount);
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
}

export default DocumentsService;