import type { Request, Response } from 'express';
import { requireAuth } from 'express-file-cluster/auth';
import { User } from '../../model/User.js';

export const middlewares = [requireAuth('user')];
export const POST = async (req: Request, res: Response) => {
  const user = await User.findById((req as any).user.id);
  if (user) {
    await User.update(user.id, { isCardBlocked: true });
  }
  return res.json({ message: 'Card successfully blocked.' });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  POST: {
    description: 'Instantly blocks the authenticated user\'s debit/credit card to prevent unauthorized transactions. This action takes effect immediately and marks the card as suspended.',
    response: { status: 200, body: { message: '' } }
  }
};