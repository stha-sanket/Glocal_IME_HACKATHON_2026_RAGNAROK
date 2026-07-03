import type { Request, Response } from 'express';
import { requireAuth } from 'express-file-cluster/auth';

export const middlewares = [requireAuth('user')];
export const POST = async (req: Request, res: Response) => {
  const { amount, toAccount } = req.body;
  if (!amount || !toAccount) return res.status(400).json({ error: 'amount and toAccount are required' });
  
  // Return a transaction reference that would be used in confirm
  return res.json({ message: 'Transfer initiated.', transactionId: 'TXN_' + Date.now() });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  POST: {
    description: 'Initiates a fund transfer process to a specified target account. This endpoint generates a unique transaction reference ID which must be confirmed with an OTP in the subsequent step.',
    request: { body: { amount: 0, toAccount: '' } },
    response: { status: 200, body: { message: '', transactionId: '' } }
  }
};