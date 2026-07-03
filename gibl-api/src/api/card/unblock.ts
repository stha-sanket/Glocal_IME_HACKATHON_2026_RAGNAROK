import type { Request, Response } from 'express';
import { requireAuth } from 'express-file-cluster/auth';
import { User } from '../../model/User.js';

export const middlewares = [requireAuth('user')];
export const POST = async (req: Request, res: Response) => {
  const user = await User.findById((req as any).user.id);
  if (user) {
    await User.update(user.id, { isCardBlocked: false });
  }
  return res.json({ message: 'Card successfully unblocked.' });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  POST: {
    description: 'Restores functionality to a previously blocked debit/credit card for the authenticated user. Once unblocked, the card can be used for regular transactions immediately.',
    response: { status: 200, body: { message: '' } }
  }
};