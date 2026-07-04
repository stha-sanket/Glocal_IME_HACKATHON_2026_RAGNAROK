import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { issueToken } from "express-file-cluster/auth";
import { User } from "../../model/User.js";

export const POST = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  await issueToken(res, { id: user.id, role: user.role, email: user.email });
  return res.json({
    message: "Logged in successfully",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      accountNumber: user.accountNumber,
    },
  });
};

import type { RouteMeta } from "express-file-cluster";
export const meta: RouteMeta = {
  POST: {
    description:
      "Authenticates a user using their email address and password. On success, securely sets a session token and returns basic user profile information.",
    request: { body: { email: "", password: "" } },
    response: {
      status: 200,
      body: { message: "", user: { id: "", name: "", email: "", accountNumber: "" } },
    },
  },
};
