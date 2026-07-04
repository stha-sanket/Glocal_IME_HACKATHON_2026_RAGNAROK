import mongoose from 'mongoose';
import { User } from './src/model/User.js';

const BASE_URL = 'http://localhost:3002/api/v2';
const email = 'prashant_adhikari_a25@sunway.edu.np';
const password = 'prashant012a';

async function run() {
  // 1. Connect to DB and clear existing user so we can test registration cleanly
  await mongoose.connect(process.env.DATABASE_URL!);
  await mongoose.connection.collection('users').deleteMany({ email });
  console.log(`[DB] Cleared existing user with email ${email}`);

  // 2. Test Registration
  console.log('\n--- 1. Testing Registration ---');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Prashant Adhikari', email, password })
  });
  console.log(`Status: ${regRes.status}`);
  console.log(`Body:`, await regRes.json());

  // 3. Test Login
  console.log('\n--- 2. Testing Login ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  console.log(`Status: ${loginRes.status}`);
  const loginData = await loginRes.json();
  console.log(`Body:`, loginData);

  const setCookie = loginRes.headers.get('set-cookie');
  if (!setCookie) {
    console.error('No cookie received! Auth failed.');
    process.exit(1);
  }
  const token = setCookie.split(';')[0].split('=')[1];
  console.log(`[Auth] Secure session token received.`);

  // 4. Test OTP Send
  console.log('\n--- 3. Testing OTP Send ---');
  const user = await mongoose.connection.collection('users').findOne({ email });
  const otpRes = await fetch(`${BASE_URL}/otp/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `efc_token=${token}`
    },
    body: JSON.stringify({ clientId: user!._id.toString() })
  });
  console.log(`Status: ${otpRes.status}`);
  console.log(`Body:`, await otpRes.json());

  console.log('\n✅ Flow completed! Check your email for the OTP.');
  process.exit(0);
}

run().catch(console.error);
