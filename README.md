# Cos-Mate

AI-powered study companion application that helps you learn more efficiently.

## Features

- Study channels for organizing content
- Document management with AI-powered analysis
- Automatic quiz generation from your study materials
- Smart summaries and key point extraction

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000 in your browser

## Project Structure

```
cos-mate/
├── api/              # API routes
├── public/           # Frontend assets
│   ├── index.html
│   ├── css/
│   └── js/
├── src/              # Source code
│   ├── config/       # Configuration
│   ├── routes/       # API routes
│   ├── controllers/  # Request handlers
│   ├── services/     # Business logic
│   │   ├── ai/       # AI services
│   │   ├── channels/ # Channel management
│   │   ├── documents/ # Document management
│   │   └── quiz/     # Quiz generation
│   └── utils/        # Utility functions
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/channels` - Get all channels
- `POST /api/channels` - Create a new channel
- `GET /api/documents` - Get all documents
- `POST /api/documents` - Add a new document
- `POST /api/quiz/generate` - Generate a quiz from content

## License

ISC