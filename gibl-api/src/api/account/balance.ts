import type { Request, Response } from 'express';
import { requireServiceOrUser } from '../../middlewares/serviceAuth.js';
import { User } from '../../model/User.js';

export const middlewares = [requireServiceOrUser('user')];
export const GET = async (req: Request, res: Response) => {
  const user = await User.findById((req as any).user.id);
  return res.json({ balance: user?.balance || 0, currency: 'NPR' });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  GET: {
    description: 'Fetches the real-time available balance for the authenticated user\'s primary account, returning the amount in NPR along with currency details.',
    response: { status: 200, body: { balance: 0, currency: 'NPR' } }
  }
};