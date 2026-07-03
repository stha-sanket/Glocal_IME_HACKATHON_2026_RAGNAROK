import type { Request, Response } from 'express';
import { requireAuth } from 'express-file-cluster/auth';

export const middlewares = [requireAuth('user')];
export const POST = async (req: Request, res: Response) => {
  const { amount, toAccount } = req.body;
  if (!amount || !toAccount) return res.status(400).json({ error: 'amount and toAccount are required' });
  
  // Return a transaction reference that would be used in confirm
  return res.json({ message: 'Transfer initiated.', transactionId: 'TXN_' + Date.now() });
};
