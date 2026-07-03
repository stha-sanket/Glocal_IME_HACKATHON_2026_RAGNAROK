import type { Request, Response } from 'express';
import { requireAuth } from 'express-file-cluster/auth';

export const middlewares = [requireAuth('user')];
export const POST = async (req: Request, res: Response) => {
  const { otp } = req.body;
  if (otp === '123456') { // Mock validation
    return res.json({ message: 'OTP verified successfully.', verified: true });
  }
  return res.status(400).json({ error: 'Invalid OTP.', verified: false });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  POST: {
    description: 'Validates a previously dispatched One-Time Password (OTP). Used as a standalone verification step or in conjunction with multi-factor authentication flows.',
    request: { body: { otp: '' } },
    response: { status: 200, body: { message: '', verified: true } }
  }
};