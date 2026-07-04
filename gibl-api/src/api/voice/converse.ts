import type { Request, Response } from "express";
import { requireAuth } from "express-file-cluster/auth";
import { createSilentWavBase64 } from "../../lib/placeholderAudio.js";

export const middlewares = [requireAuth("user")];
export const POST = async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });

  const authUser = (req as any).user;

  try {
    const dataLayerRes = await fetch(process.env.DATA_LAYER_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Key": process.env.DATA_LAYER_SERVICE_SECRET ?? "",
      },
      body: JSON.stringify({ text, clientId: authUser.id }),
    });

    if (!dataLayerRes.ok) {
      throw new Error(`Data layer responded with ${dataLayerRes.status}`);
    }

    const data = await dataLayerRes.json();
    return res.json({ text: data.text, audio: data.audio });
  } catch (err) {
    console.error("[voice/converse] Data layer unreachable, returning placeholder response:", err);
    return res.json({
      text: "I'm unable to reach the assistant service right now. Please try again shortly.",
      audio: createSilentWavBase64(1),
      mock: true,
    });
  }
};

import type { RouteMeta } from "express-file-cluster";
export const meta: RouteMeta = {
  POST: {
    description:
      "Entry point for the voice assistant pipeline. Forwards the user's transcribed text to the Data Layer, which performs language/intent classification, calls back into this server's tool endpoints to complete the request, and synthesizes a spoken reply. Returns the final reply text plus a base64-encoded WAV. Falls back to a placeholder response if the Data Layer is unreachable.",
    request: { body: { text: "" } },
    response: { status: 200, body: { text: "", audio: "" } },
  },
};
