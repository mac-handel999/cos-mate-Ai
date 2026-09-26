import "dotenv/config";

const requiredEnv = [
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_WEBHOOK_SECRET",
    "GROQ_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY"
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}

export const env = {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
    groqApiKey: process.env.GROQ_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
};