import { defineModel } from 'express-file-cluster';

export interface CategoryDocument {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
}

export const Category = defineModel<CategoryDocument>('Category', {
  name:        { type: 'string', required: true },
  slug:        { type: 'string', required: true, unique: true },
  description: { type: 'string' },
  parentId:    { type: 'string' },
});
