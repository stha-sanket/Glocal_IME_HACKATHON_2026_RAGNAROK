import type { Request, Response } from 'express';
import { requireAuth } from 'express-file-cluster/auth';
import { User } from '../../model/User.js';

export const middlewares = [requireAuth('user')];
export const GET = async (req: Request, res: Response) => {
  const user = await User.findById((req as any).user.id);
  return res.json({
    id: user?.id,
    accountNumber: user?.accountNumber || 'N/A',
    name: user?.name,
    email: user?.email,
    isCardBlocked: user?.isCardBlocked
  });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  GET: {
    description: 'Provides essential account profile information for the authenticated user, including their ID, registered name, email address, assigned account number, and current card status.',
    response: { status: 200, body: { id: '', accountNumber: '', name: '', email: '', isCardBlocked: false } }
  }
};