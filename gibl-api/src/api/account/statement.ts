import type { Request, Response } from 'express';
import { requireAuth } from 'express-file-cluster/auth';

export const middlewares = [requireAuth('user')];
export const GET = async (req: Request, res: Response) => {
  return res.json({
    statements: [
      { id: '1', date: new Date().toISOString(), amount: -500, description: 'Retrieves the recent transaction history and account statements for the authenticated user, including transaction IDs, dates, amounts, and transaction descriptions.' },
      { id: '2', date: new Date(Date.now() - 86400000).toISOString(), amount: 15000, description: 'Salary' }
    ]
  });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  GET: {
    description: 'Retrieve recent account statements',
    response: { status: 200, body: { statements: [{ id: '1', date: '2026-01-01T00:00:00.000Z', amount: 0, description: '' }] } }
  }
};