import type { Request, Response } from 'express';
import { requireAuth } from 'express-file-cluster/auth';

export const middlewares = [requireAuth('user')];
export const GET = async (req: Request, res: Response) => {
  return res.json({
    statements: [
      { id: '1', date: new Date().toISOString(), amount: -500, description: 'Groceries' },
      { id: '2', date: new Date(Date.now() - 86400000).toISOString(), amount: 15000, description: 'Salary' }
    ]
  });
};
