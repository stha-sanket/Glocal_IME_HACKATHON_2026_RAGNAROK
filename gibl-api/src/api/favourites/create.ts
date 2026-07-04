import type { Request, Response } from "express";
import { requireServiceOrUser } from "../../middlewares/serviceAuth.js";
import { FavouriteAccount } from "../../model/FavouriteAccount.js";

export const middlewares = [requireServiceOrUser("user")];
export const POST = async (req: Request, res: Response) => {
  const { clientId, nickname, accountNumber } = req.body;
  if (!clientId || !nickname || !accountNumber) {
    return res.status(400).json({ error: "clientId, nickname and accountNumber are required" });
  }

  const authUser = (req as any).user;
  if (authUser.id !== clientId) {
    return res.status(403).json({ error: "Forbidden: clientId does not match authenticated user." });
  }

  const favourite = await FavouriteAccount.create({ userId: clientId, nickname, accountNumber });
  return res.json({
    message: "Favourite account added.",
    favourite: { id: favourite.id, nickname: favourite.nickname, accountNumber: favourite.accountNumber },
  });
};

import type { RouteMeta } from "express-file-cluster";
export const meta: RouteMeta = {
  POST: {
    description:
      "Registers a new favourite (beneficiary) account for the authenticated user, identified by a nickname (e.g. 'Sanket dai') and account number. Favourite accounts are required before initiating a transfer to that account.",
    request: { body: { clientId: "", nickname: "Sanket dai", accountNumber: "" } },
    response: { status: 200, body: { message: "", favourite: { id: "", nickname: "", accountNumber: "" } } },
  },
};
