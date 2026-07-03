import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: 'Fetch a single faq by ID (admin only).',
      request: { params: { id: 'faq_01HXZ' } },
      response: { status: 200, body: { faq: { id: 'faq_01HXZ', question: 'sample-question', answer: 'sample-answer', category: 'sample-category' } } },
  },
  PUT: {
    description: 'Update a faq by ID (admin only).',
      request: { params: { id: 'faq_01HXZ' }, body: { question: 'sample-question', answer: 'sample-answer', category: 'sample-category' } },
      response: { status: 200, body: { message: 'FAQ updated', faq: { id: 'faq_01HXZ', question: 'sample-question', answer: 'sample-answer', category: 'sample-category' } } },
  },
  DELETE: {
    description: 'Delete a faq by ID (admin only).',
      request: { params: { id: 'faq_01HXZ' } },
      response: { status: 200, body: { message: 'FAQ faq_01HXZ deleted' } },
  },
};

export const middlewares = [requireAuth('admin')];

export const GET = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: fetch FAQ by id
  res.json({ faq: { id } });
};

export const PUT = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: update FAQ
  res.json({ message: 'FAQ updated', faq: { id, ...req.body } });
};

export const DELETE = async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: delete FAQ
  res.json({ message: `FAQ ${id} deleted` });
};
