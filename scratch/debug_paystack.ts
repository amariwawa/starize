import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

async function dumpTransactions() {
  const response = await fetch(`https://api.paystack.co/transaction?perPage=20&status=success`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });

  const data = await response.json();
  console.log(JSON.stringify(data.data.map((tx: any) => ({
    reference: tx.reference,
    amount: tx.amount,
    paid_at: tx.paid_at,
    metadata: tx.metadata
  })), null, 2));
}

dumpTransactions().catch(console.error);
