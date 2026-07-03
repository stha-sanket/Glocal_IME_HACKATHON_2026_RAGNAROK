import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../../model/User.js';

export const POST = async (req: Request, res: Response) => {
  const { name, email, password, accountNumber } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
  
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: 'User already exists' });

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ 
    name, 
    email, 
    password: hashed, 
    accountNumber: accountNumber || Math.floor(10000000000000 + Math.random() * 90000000000000).toString(),
    balance: 50000,
    isCardBlocked: false,
    role: 'user',
    isActive: true 
  });
  
  return res.json({ message: 'User registered successfully.' });
};


import type { RouteMeta } from 'express-file-cluster';
export const meta: RouteMeta = {
  POST: {
    description: 'Registers a new user into the banking system by securely hashing their password and generating a new, unique account number with a starting promotional balance.',
    request: { body: { name: '', email: '', password: '', accountNumber: '' } },
    response: { status: 200, body: { message: '' } }
  }
};