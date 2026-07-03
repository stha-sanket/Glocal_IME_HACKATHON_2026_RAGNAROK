import type { Request, Response } from 'express';
import { requireAuth } from 'express-file-cluster/auth';

export const middlewares = [requireAuth('user')];
export const POST = async (req: Request, res: Response) => {
  return res.json({ message: 'OTP sent to registered mobile/email.' });
};
