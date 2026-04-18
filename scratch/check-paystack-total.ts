import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.error('Missing PAYSTACK_SECRET_KEY');
  process.exit(1);
}

async function checkTotal() {
  const response = await fetch('https://api.paystack.co/transaction?perPage=1', {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Paystack API error: ${response.status} ${errorBody}`);
  }

  const body = await response.json();
  console.log('--- Paystack Transaction Meta ---');
  console.log('Total Transactions:', body.meta.total);
  console.log('Total Pages (perPage=100):', Math.ceil(body.meta.total / 100));
}

checkTotal().catch(console.error);
