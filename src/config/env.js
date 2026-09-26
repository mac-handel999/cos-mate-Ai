import "dotenv/config";

const requiredEnv = [
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_WEBHOOK_SECRET",
  "GROQ_API_KEY"
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
  groqApiKey: process.env.GROQ_API_KEY,
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  whatsappAppSecret: process.env.WHATSAPP_APP_SECRET,
  whatsappApiVersion: process.env.WHATSAPP_API_VERSION || "v26.0"
};
