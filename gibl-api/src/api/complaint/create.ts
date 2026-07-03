import type { Request, Response } from 'express';
import { requireAuth } from 'express-file-cluster/auth';

export const middlewares = [requireAuth('user')];
export const POST = async (req: Request, res: Response) => {
  const { subject, description } = req.body;
  return res.json({ message: 'Complaint registered successfully.', ticketId: 'TCK_' + Date.now() });
};
