import express from "express";
import { env } from "../../config/env.js";
import { handleTelegramUpdate } from "./telegram.service.js";

const router = express.Router();

router.post("/webhook", async (req, res) => {
  try {
    const secret =
      req.headers["x-telegram-bot-api-secret-token"];

    if (secret !== env.telegramWebhookSecret) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    await handleTelegramUpdate(req.body);

    return res.status(200).json({
      ok: true
    });

  } catch (error) {
    console.error("Telegram webhook error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

export default router;