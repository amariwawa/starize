import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

async function checkMeta() {
  const response = await fetch(`https://api.paystack.co/transaction?perPage=1`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  const body = await response.json();
  console.log('--- Paystack Statistics ---');
  console.log('Total Transactions:', body.meta.total);
  console.log('Skipped:', body.meta.skipped);
  console.log('Per Page:', body.meta.per_page);
  console.log('Page Count:', body.meta.pageCount);
  console.log('Current Page:', body.meta.page);
}

checkMeta().catch(console.error);
