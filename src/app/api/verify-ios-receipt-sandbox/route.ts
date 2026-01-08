// app/api/verify-receipt/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const APPLE_ISSUER_ID = process.env.APPLE_ISSUER_ID;
const APPLE_KEY_ID = process.env.APPLE_KEY_ID;
const APPLE_PRIVATE_KEY_RAW = process.env.APPLE_PRIVATE_KEY;
const APPLE_PRIVATE_KEY = APPLE_PRIVATE_KEY_RAW ? APPLE_PRIVATE_KEY_RAW.replace(/\\n/g, '\n') : undefined;

console.log('APPLE_ISSUER_ID', APPLE_ISSUER_ID)
console.log('APPLE_KEY_ID', APPLE_KEY_ID)
console.log('APPLE_PRIVATE_KEY', Boolean(APPLE_PRIVATE_KEY))

function generateJWT(): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: APPLE_ISSUER_ID,
    iat: now,
    exp: now + 1800,
    aud: 'appstoreconnect-v1',
    bid: 'com.toonyz.mobile'
  };

  if (!APPLE_ISSUER_ID || !APPLE_KEY_ID || !APPLE_PRIVATE_KEY) {
    throw new Error('Missing Apple configuration: APPLE_ISSUER_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY are required');
  }

  return jwt.sign(payload, APPLE_PRIVATE_KEY, {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: APPLE_KEY_ID,
      typ: 'JWT',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { transactionId } = await req.json();
    console.log('transactionId', transactionId)
    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 });
    }

    const token = generateJWT();
    console.log(token)
    const response = await axios.get(
      `https://api.storekit-sandbox.itunes.apple.com/inApps/v1/transactions/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json({ success: true, data: response.data });
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    return NextResponse.json(
      { error: 'Failed to verify transaction', details: err.response?.data || err.message },
      { status: 500 }
    );
  }
}
