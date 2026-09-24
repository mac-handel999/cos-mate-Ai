import express from "express";
import telegramRoutes from "../src/services/telegram/telegram.routes.js";

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

app.use("/api/telegram", telegramRoutes);

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