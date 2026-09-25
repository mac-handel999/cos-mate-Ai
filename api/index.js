import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import telegramRoutes from "../src/services/telegram/telegram.routes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
    console.log("Health endpoint hit");

    res.status(200).json({
        ok: true,
        service: "COS MATE API",
        timestamp: new Date().toISOString()
    });
});

app.get("/api/telegram/test", (req, res) => {
    console.log("Telegram test endpoint hit");

    res.status(200).json({
        ok: true,
        service: "COS MATE Telegram",
        message: "Telegram route is reachable"
    });
});

// Diagnostic endpoint: test Telegram API directly
app.get("/api/telegram/test-send", async (req, res) => {
    try {
        const { sendTelegramMessage } =
            await import("../src/services/telegram/telegram.js");

        const chatId = req.query.chat_id;

        if (!chatId) {
            return res.status(400).json({
                ok: false,
                error: "chat_id is required"
            });
        }

        const result = await sendTelegramMessage(
            chatId,
            "🚀 COS MATE Telegram API test successful."
        );

        return res.json({
            ok: true,
            telegram: result
        });

    } catch (error) {
        console.error("Telegram test failed:", error);

        return res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

app.use("/api/telegram", telegramRoutes);

// Serve static files from public directory
app.use(express.static(join(__dirname, "..", "public")));

// Serve index.html for root path
app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "..", "public", "index.html"));
});

// Start server for local development (Vercel handles this in production)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`COS MATE server running on port ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
        console.log(`Telegram test: http://localhost:${PORT}/api/telegram/test`);
    });
}

export default app;