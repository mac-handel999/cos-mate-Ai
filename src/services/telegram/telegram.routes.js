import express from "express";
import { env } from "../../config/env.js";
import { handleTelegramUpdate } from "./telegram.service.js";

const router = express.Router();

router.post("/webhook", async (req, res) => {
    console.log("=================================");
    console.log("TELEGRAM WEBHOOK RECEIVED");
    console.log("=================================");

    try {
        const secret =
            req.headers["x-telegram-bot-api-secret-token"];

        console.log("Secret received:", Boolean(secret));
        console.log(
            "Secret valid:",
            secret === env.telegramWebhookSecret
        );

        if (secret !== env.telegramWebhookSecret) {
            console.error("Telegram webhook secret mismatch.");

            return res.status(401).json({
                error: "Unauthorized"
            });
        }

        console.log(
            "Update ID:",
            req.body?.update_id
        );

        console.log(
            "Message:",
            req.body?.message?.text || "(not a text message)"
        );

        // Acknowledge Telegram immediately.
        res.status(200).json({
            ok: true
        });

        // Process the update after responding.
        await handleTelegramUpdate(req.body);

        console.log("Telegram update processed successfully.");

    } catch (error) {
        console.error("Telegram webhook error:", error);

        // If the response has already been sent,
        // don't attempt to send another response.
        if (!res.headersSent) {
            return res.status(500).json({
                error: "Internal server error"
            });
        }
    }
});

export default router;