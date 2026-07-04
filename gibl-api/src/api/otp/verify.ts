import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { redis } from "../../lib/redis.js";
import { requireServiceOrUser } from "../../middlewares/serviceAuth.js";

export const middlewares = [requireServiceOrUser("user")];
export const POST = async (req: Request, res: Response) => {
  const { clientId, otp } = req.body;
  if (!clientId || !otp)
    return res.status(400).json({ error: "clientId and otp are required" });

  const authUser = (req as any).user;
  if (authUser.id !== clientId) {
    return res.status(403).json({ error: "Forbidden: clientId does not match authenticated user." });
  }

  const key = `otp:${clientId}`;
  const otpHash = await redis.get(key);
  if (!otpHash)
    return res
      .status(400)
      .json({ error: "OTP expired or not requested.", verified: false });

  const match = await bcrypt.compare(otp, otpHash);
  if (!match)
    return res.status(400).json({ error: "Invalid OTP.", verified: false });

  await redis.del(key);
  return res.json({ message: "OTP verified successfully.", verified: true });
};

import type { RouteMeta } from "express-file-cluster";
export const meta: RouteMeta = {
  POST: {
    description:
      "Validates a previously dispatched One-Time Password (OTP). Used as a standalone verification step or in conjunction with multi-factor authentication flows.",
    request: { body: { clientId: "", otp: "" } },
    response: { status: 200, body: { message: "", verified: true } },
  },
};
