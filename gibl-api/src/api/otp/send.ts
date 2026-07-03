import type { Request, Response } from 'express';
import { requireAuth } from 'express-file-cluster/auth';

export const middlewares = [requireAuth('user')];
export const POST = async (req: Request, res: Response) => {
  return res.json({ message: 'OTP sent to registered mobile/email.' });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  POST: {
    description: 'Triggers the dispatch of a One-Time Password (OTP) to the user\'s registered contact methods (SMS/Email) for identity verification during sensitive operations.',
    response: { status: 200, body: { message: '' } }
  }
};