import { defineModel } from 'express-file-cluster';

export interface FavouriteAccountDocument {
  userId: string;
  nickname: string;
  accountNumber: string;
}

export const FavouriteAccount = defineModel<FavouriteAccountDocument>('FavouriteAccount', {
  userId:        { type: 'string', required: true },
  nickname:      { type: 'string', required: true },
  accountNumber: { type: 'string', required: true },
});
