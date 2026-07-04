import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { requireServiceOrUser } from '../../middlewares/serviceAuth.js';
import { Transaction } from '../../model/Transaction.js';
import { User } from '../../model/User.js';
import { redis } from '../../lib/redis.js';

const LOG_TAG = '[transfer/confirm]';
const isProd = process.env.NODE_ENV === 'production';

export const middlewares = [requireServiceOrUser('user')];
export const POST = async (req: Request, res: Response) => {
  const { transactionId, otp } = req.body;
  console.log(LOG_TAG, 'request received', { transactionId, otp: isProd ? '[redacted]' : otp });

  if (!transactionId || !otp) {
    console.log(LOG_TAG, 'rejected: missing transactionId or otp');
    return res.status(400).json({ error: 'transactionId and otp are required' });
  }

  const authUser = (req as any).user;

  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    console.log(LOG_TAG, 'rejected: transactionId is not a valid id', { transactionId });
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  const transaction = await Transaction.findById(transactionId);
  if (!transaction || transaction.clientId !== authUser.id) {
    console.log(LOG_TAG, 'rejected: transaction not found or not owned by user', { transactionId, authUserId: authUser.id });
    return res.status(404).json({ error: 'Transaction not found.' });
  }

  if (transaction.status !== 'pending') {
    console.log(LOG_TAG, 'rejected: transaction not pending', { transactionId, status: transaction.status });
    return res.status(409).json({ error: `Transaction is already ${transaction.status}.` });
  }

  const otpKey = `otp:txn:${transactionId}`;
  const otpHash = await redis.get(otpKey);
  if (!otpHash) {
    console.log(LOG_TAG, 'rejected: no otp hash found in redis (expired or never requested)', { otpKey });
    return res.status(400).json({ error: 'OTP expired or not requested.' });
  }

  const match = await bcrypt.compare(otp, otpHash);
  console.log(LOG_TAG, 'otp comparison result', { transactionId, match });
  if (!match) {
    return res.status(400).json({ error: 'Invalid OTP.' });
  }

  await redis.del(otpKey);
  console.log(LOG_TAG, 'otp consumed', { otpKey });

  const sender = await User.findById(transaction.clientId);
  if (!sender) {
    console.error(LOG_TAG, 'sender account not found', { transactionId, clientId: transaction.clientId });
    await Transaction.update(transactionId, { status: 'failed' });
    return res.status(500).json({ error: 'Sender account not found.' });
  }

  if (sender.balance < transaction.amount) {
    console.log(LOG_TAG, 'rejected: insufficient balance', { transactionId, balance: sender.balance, amount: transaction.amount });
    await Transaction.update(transactionId, { status: 'failed' });
    return res.status(400).json({ error: 'Insufficient balance.' });
  }

  const receiver = await User.findOne({ accountNumber: transaction.toAccount });
  if (!receiver) {
    console.log(LOG_TAG, 'rejected: destination account not found', { transactionId, toAccount: transaction.toAccount });
    await Transaction.update(transactionId, { status: 'failed' });
    return res.status(404).json({ error: 'Destination account not found.' });
  }

  const newSenderBalance = sender.balance - transaction.amount;
  await User.update(sender.id, { balance: newSenderBalance });
  console.log(LOG_TAG, 'sender debited', { transactionId, clientId: sender.id, newBalance: newSenderBalance });

  const receiverBaseline = receiver.id === sender.id ? newSenderBalance : receiver.balance;
  const newReceiverBalance = receiverBaseline + transaction.amount;
  await User.update(receiver.id, { balance: newReceiverBalance });
  console.log(LOG_TAG, 'receiver credited', { transactionId, receiverId: receiver.id, newBalance: newReceiverBalance });

  await Transaction.update(transactionId, { status: 'confirmed' });
  console.log(LOG_TAG, 'transfer confirmed', { transactionId });

  return res.json({ message: 'Transfer successful.', transactionId });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  POST: {
    description: 'Finalizes a pending fund transfer by verifying the One-Time Password (OTP) associated with the transaction reference ID. Looks up the stored Transaction by transactionId, confirms it belongs to the authenticated user and is still pending, then checks the OTP hash stored against that transaction. On success, the transfer amount is debited from the sender\'s balance and credited to the receiving account\'s balance (matched by accountNumber), and the Transaction status is updated to confirmed. If the sender has insufficient balance or the destination accountNumber does not match any account, the Transaction is marked failed and no balances are changed.',
    request: { body: { transactionId: '', otp: '' } },
    response: { status: 200, body: { message: '', transactionId: '' } }
  }
};