import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

async function debugLatest() {
  console.log('--- Inspecting Latest 50 Paystack Transactions ---');
  const response = await fetch(`https://api.paystack.co/transaction?perPage=50`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  const body = await response.json();
  const transactions = body.data;

  for (const tx of transactions) {
     const metadata = tx.metadata || {};
     const customFields = metadata.custom_fields || [];
     const paymentType = customFields.find((f:any) => f.variable_name === 'payment_type')?.value || metadata.type || 'unknown';
     
     console.log(`Ref: ${tx.reference} | Status: ${tx.status} | Type: ${paymentType}`);
     if (paymentType === 'unknown') {
        console.log('Metadata:', JSON.stringify(metadata, null, 2));
     }
  }
}

debugLatest().catch(console.error);
