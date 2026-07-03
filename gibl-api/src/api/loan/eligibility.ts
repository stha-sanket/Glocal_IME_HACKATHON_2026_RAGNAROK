import type { Request, Response } from 'express';
import { requireAuth } from 'express-file-cluster/auth';
import { User } from '../../../../model/User.js';

export const middlewares = [requireAuth('user')];
export const GET = async (req: Request, res: Response) => {
  const user = await User.findOne({ id: req.user.id });
  const isEligible = (user?.balance || 0) > 10000;
  return res.json({ eligible: isEligible, maxAmount: isEligible ? 500000 : 0 });
};
