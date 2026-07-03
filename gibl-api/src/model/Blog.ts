import { defineModel } from 'express-file-cluster';

export interface BlogDocument {
  title: string;
  slug: string;
  content: string;
  authorId: string;
  category: string;
  tags: string[];
  status: string;
  publishedAt?: Date;
}

export const Blog = defineModel<BlogDocument>('Blog', {
  title:       { type: 'string', required: true },
  slug:        { type: 'string', required: true, unique: true },
  content:     { type: 'string', required: true },
  authorId:    { type: 'string', required: true },
  category:    { type: 'string', required: true, default: 'general' },
  tags:        { type: 'array',  default: [] },
  status:      { type: 'string', required: true, default: 'draft' },
  publishedAt: { type: 'date' },
});
