import type { Request, Response } from 'express';
import { requireAuth } from 'express-file-cluster/auth';
import { User } from '../../model/User.js';

export const middlewares = [requireAuth('user')];
export const POST = async (req: Request, res: Response) => {
  const { transactionId, otp } = req.body;
  if (!transactionId || !otp) return res.status(400).json({ error: 'transactionId and otp are required' });
  
  // Basic mock implementation of confirm
  return res.json({ message: 'Transfer successful.', transactionId });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  POST: {
    description: 'Finalizes a pending fund transfer by verifying the One-Time Password (OTP) associated with the transaction reference ID. The funds are deducted upon successful verification.',
    request: { body: { transactionId: '', otp: '' } },
    response: { status: 200, body: { message: '', transactionId: '' } }
  }
};