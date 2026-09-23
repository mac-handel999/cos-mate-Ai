import AIService from '../ai/aiService.js';

class ChannelsService extends AIService {
  constructor() {
    super();
    this.channels = new Map();
  }

  createChannel(name, description = '') {
    const channel = {
      id: this.generateId(),
      name,
      description,
      createdAt: new Date(),
      documents: [],
    };
    this.channels.set(channel.id, channel);
    return channel;
  }

  getChannel(channelId) {
    return this.channels.get(channelId);
  }

  getAllChannels() {
    return Array.from(this.channels.values());
  }

  deleteChannel(channelId) {
    return this.channels.delete(channelId);
  }

  async summarizeChannel(channelId) {
    const channel = this.getChannel(channelId);
    if (!channel) throw new Error('Channel not found');
    
    const allContent = channel.documents.map(doc => doc.content).join('\n\n');
    return this.analyzeDocument(allContent, 'summary');
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
}

export default ChannelsService;