import { defineModel } from 'express-file-cluster';

export interface FAQDocument {
  question: string;
  answer: string;
  category: string;
  order: number;
  isPublished: boolean;
}

export const FAQ = defineModel<FAQDocument>('FAQ', {
  question:    { type: 'string',  required: true },
  answer:      { type: 'string',  required: true },
  category:    { type: 'string',  required: true, default: 'general' },
  order:       { type: 'number',  default: 0 },
  isPublished: { type: 'boolean', default: false },
});
