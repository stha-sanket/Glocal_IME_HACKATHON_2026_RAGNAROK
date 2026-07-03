import type { Request, Response } from 'express';
import { requireAuth } from 'express-file-cluster/auth';
import { User } from '../../model/User.js';

export const middlewares = [requireAuth('user')];
export const GET = async (req: Request, res: Response) => {
  const user = await User.findById((req as any).user.id);
  const isEligible = (user?.balance || 0) > 10000;
  return res.json({ eligible: isEligible, maxAmount: isEligible ? 500000 : 0 });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  GET: {
    description: 'Evaluates the authenticated user\'s financial profile and current balance to determine their eligibility for a loan, returning their qualification status and the maximum pre-approved amount.',
    response: { status: 200, body: { eligible: false, maxAmount: 0 } }
  }
};