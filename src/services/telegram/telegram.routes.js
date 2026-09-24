import express from "express";
import { env } from "../../config/env.js";
import { handleTelegramUpdate } from "./telegram.service.js";

const router = express.Router();

router.get("/test", (req, res) => {
    console.log("Telegram router test reached.");

    res.status(200).json({
        ok: true,
        message: "Telegram router is working"
    });
});

router.post("/webhook", async (req, res) => {
    console.log("================================");
    console.log("TELEGRAM WEBHOOK RECEIVED");
    console.log("================================");

    console.log("Update ID:", req.body?.update_id);
    console.log("Message:", req.body?.message?.text);

    const receivedSecret =
        req.headers["x-telegram-bot-api-secret-token"];

    console.log("Secret received:", Boolean(receivedSecret));

    if (receivedSecret !== env.telegramWebhookSecret) {
        console.error("WEBHOOK SECRET MISMATCH");

        return res.status(401).json({
            ok: false,
            error: "Unauthorized"
        });
    }

    console.log("Webhook secret verified.");

    try {
        await handleTelegramUpdate(req.body);

        console.log("Telegram update processed.");

        return res.status(200).json({
            ok: true
        });

    } catch (error) {
        console.error("Telegram update failed:");
        console.error(error);

        return res.status(500).json({
            ok: false,
            error: "Internal server error"
        });
    }
});

export default router;