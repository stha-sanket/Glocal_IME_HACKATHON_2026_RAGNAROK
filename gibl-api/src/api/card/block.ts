import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { requireServiceOrUser } from '../../middlewares/serviceAuth.js';
import { User } from '../../model/User.js';
import { redis } from '../../lib/redis.js';

const LOG_TAG = '[card/block]';
const isProd = process.env.NODE_ENV === 'production';

export const middlewares = [requireServiceOrUser('user')];
export const POST = async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  const { otp } = req.body;
  console.log(LOG_TAG, 'request received', { userId: authUser.id, otp: isProd ? '[redacted]' : otp });

  const verifiedKey = `otp-verified:${authUser.id}`;
  const alreadyVerified = await redis.get(verifiedKey);

  if (alreadyVerified) {
    await redis.del(verifiedKey);
    console.log(LOG_TAG, 'accepted via prior /otp/verify flag', { verifiedKey });
  } else {
    if (!otp) {
      console.log(LOG_TAG, 'rejected: missing otp and no prior verification flag', { verifiedKey });
      return res.status(400).json({ error: 'otp is required (or call /otp/verify first)' });
    }

    const otpKey = `otp:${authUser.id}`;
    const otpHash = await redis.get(otpKey);
    if (!otpHash) {
      console.log(LOG_TAG, 'rejected: no otp hash found in redis (expired or never requested)', { otpKey });
      return res.status(400).json({ error: 'OTP expired or not requested.' });
    }

    const match = await bcrypt.compare(otp, otpHash);
    console.log(LOG_TAG, 'otp comparison result', { userId: authUser.id, match });
    if (!match) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }
    await redis.del(otpKey);
  }

  const user = await User.findById(authUser.id);
  if (user) {
    await User.update(user.id, { isCardBlocked: true });
    console.log(LOG_TAG, 'card blocked', { userId: user.id });
  }
  return res.json({ message: 'Card successfully blocked.' });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  POST: {
    description: 'Instantly blocks the authenticated user\'s debit/credit card to prevent unauthorized transactions. Requires OTP verification via the generic clientId-keyed OTP flow (not a transaction-scoped OTP) — either call /otp/verify first (its short-lived verified flag is consumed here automatically) or pass otp directly in this request. This action takes effect immediately and marks the card as suspended.',
    request: { body: { otp: '' } },
    response: { status: 200, body: { message: '' } }
  }
};