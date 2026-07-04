import type { Request, Response } from "express";
import { requireServiceOrUser } from "../../middlewares/serviceAuth.js";
import { FavouriteAccount } from "../../model/FavouriteAccount.js";

export const middlewares = [requireServiceOrUser("user")];
export const GET = async (req: Request, res: Response) => {
  const clientId = req.query.clientId as string;
  if (!clientId) return res.status(400).json({ error: "clientId is required" });

  const authUser = (req as any).user;
  if (authUser.id !== clientId) {
    return res.status(403).json({ error: "Forbidden: clientId does not match authenticated user." });
  }

  const favourites = await FavouriteAccount.find({ userId: clientId });
  return res.json({
    favourites: favourites.map((f: any) => ({ id: f.id, nickname: f.nickname, accountNumber: f.accountNumber })),
  });
};

import type { RouteMeta } from "express-file-cluster";
export const meta: RouteMeta = {
  GET: {
    description: "Lists the authenticated user's saved favourite (beneficiary) accounts.",
    response: { status: 200, body: { favourites: [{ id: "", nickname: "", accountNumber: "" }] } },
  },
};
