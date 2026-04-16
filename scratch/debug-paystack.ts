import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.error('Missing PAYSTACK_SECRET_KEY');
  process.exit(1);
}

async function debugPaystack() {
  console.log('--- Debugging Paystack Metadata ---');
  const response = await fetch(`https://api.paystack.co/transaction?perPage=50`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  const body = await response.json();
  const transactions = body.data;
  console.log('Meta:', JSON.stringify(body.meta, null, 2));

  for (const tx of transactions) {
     const metadata = tx.metadata || {};
     console.log(`Ref: ${tx.reference} | Status: ${tx.status} | Amount: ${tx.amount/100}`);
     console.log(`Metadata: ${JSON.stringify(metadata, null, 2)}`);
     console.log('-----------------------------------');
  }
}

debugPaystack().catch(console.error);
