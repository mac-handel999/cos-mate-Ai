import express from "express";
import { env } from "../../config/env.js";
import { isWhatsAppConfigured } from "./whatsapp.js";
import { handleWhatsAppWebhook, hasValidWhatsAppSignature } from "./whatsapp.service.js";

const router = express.Router();

router.get("/webhook", (req, res) => {
    if (!isWhatsAppConfigured()) {
        return res.status(503).send("WhatsApp is not configured.");
    }

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === env.whatsappVerifyToken && challenge) {
        return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
});

router.post("/webhook", async (req, res) => {
    if (!isWhatsAppConfigured()) {
        return res.status(503).json({ error: "WhatsApp is not configured." });
    }

    if (!hasValidWhatsAppSignature(req.rawBody, req.headers["x-hub-signature-256"])) {
        return res.sendStatus(401);
    }

    try {
        await handleWhatsAppWebhook(req.body);
        return res.sendStatus(200);
    } catch (error) {
        console.error("WhatsApp webhook failed:", error);
        return res.sendStatus(500);
    }
});

export default router;
