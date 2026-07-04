import type { Request, Response } from "express";
import { User } from "../../model/User.js";

export const middlewares = [];
export const GET = async (req: Request, res: Response) => {
  const clientId = req.query.clientId as string;
  if (!clientId) return res.status(400).json({ error: "clientId is required" });

  const user = await User.findById(clientId);
  const isEligible = (user?.balance || 0) > 10000;
  return res.json({ eligible: isEligible, maxAmount: isEligible ? 500000 : 0 });
};

import type { RouteMeta } from "express-file-cluster";
export const meta: RouteMeta = {
  GET: {
    description:
      "Evaluates the authenticated user's financial profile and current balance to determine their eligibility for a loan, returning their qualification status and the maximum pre-approved amount.",
    response: { status: 200, body: { eligible: false, maxAmount: 0 } },
  },
};
