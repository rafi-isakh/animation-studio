// app/api/verify-receipt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const APPLE_ISSUER_ID = process.env.APPLE_ISSUER_ID!;
const APPLE_KEY_ID = process.env.APPLE_KEY_ID!;
const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, '\n');

function generateJWT(): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: APPLE_ISSUER_ID,
    iat: now,
    exp: now + 1800,
    aud: 'appstoreconnect-v1',
  };

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
    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 });
    }

    const token = generateJWT();
    const response = await axios.get(
      `https://api.storekit.itunes.apple.com/inApps/v1/transactions/${transactionId}`,
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
