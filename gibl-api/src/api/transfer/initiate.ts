import type { Request, Response } from 'express';
import { requireServiceOrUser } from '../../middlewares/serviceAuth.js';
import { FavouriteAccount } from '../../model/FavouriteAccount.js';

export const middlewares = [requireServiceOrUser('user')];
export const POST = async (req: Request, res: Response) => {
  const { clientId, amount, favouriteAccountId } = req.body;
  if (!clientId || !amount || !favouriteAccountId) {
    return res.status(400).json({ error: 'clientId, amount and favouriteAccountId are required' });
  }

  const authUser = (req as any).user;
  if (authUser.id !== clientId) {
    return res.status(403).json({ error: 'Forbidden: clientId does not match authenticated user.' });
  }

  const favourite = await FavouriteAccount.findById(favouriteAccountId);
  if (!favourite || favourite.userId !== clientId) {
    return res.status(404).json({ error: 'Favourite account not found. Add it as a favourite before transferring.' });
  }

  return res.json({
    message: 'Transfer initiated.',
    transactionId: 'TXN_' + Date.now(),
    toAccount: favourite.accountNumber,
    nickname: favourite.nickname,
  });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  POST: {
    description: 'Initiates a fund transfer to one of the authenticated user\'s saved favourite accounts. Transfers can only target favourite accounts — an unrecognized favouriteAccountId is rejected. Generates a transaction reference ID which must be confirmed with an OTP in the subsequent step.',
    request: { body: { clientId: '', amount: 0, favouriteAccountId: '' } },
    response: { status: 200, body: { message: '', transactionId: '', toAccount: '', nickname: '' } }
  }
};
