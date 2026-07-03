import type { Request, Response } from 'express';
import { requireAuth } from 'express-file-cluster/auth';
import { User } from '../../../../model/User.js';

export const middlewares = [requireAuth('user')];
export const POST = async (req: Request, res: Response) => {
  const user = await User.findOne({ id: req.user.id });
  if (user) {
    await User.update(user.id, { isCardBlocked: true });
  }
  return res.json({ message: 'Card successfully blocked.' });
};
