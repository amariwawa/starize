import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.error('Missing PAYSTACK_SECRET_KEY');
  process.exit(1);
}

async function diagnoseMayowa() {
  let page = 1;
  let hasMore = true;
  const targetName = "Mayowa";
  const targetSlug = "owofadeju-mayowa";
  
  console.log(`--- Searching Paystack for transactions related to ${targetName} ---`);

  while (hasMore && page <= 15) {
    const response = await fetch(`https://api.paystack.co/transaction?perPage=50&page=${page}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    if (!response.ok) break;

    const body = await response.json();
    const transactions = body.data;

    if (!transactions || transactions.length === 0) break;

    for (const tx of transactions) {
      const metadataStr = JSON.stringify(tx.metadata || {});
      const reference = tx.reference || "";
      
      const isMatch = 
        metadataStr.toLowerCase().includes(targetName.toLowerCase()) || 
        metadataStr.toLowerCase().includes("owofadeju") ||
        reference.toLowerCase().includes(targetSlug) ||
        reference.toLowerCase().includes("owofadeju");

      if (isMatch) {
         console.log(`[MATCH] Ref: ${reference}, Status: ${tx.status}, Amount: ${tx.amount/100}, metadata: ${metadataStr}`);
      }
    }

    if (body.meta && page < body.meta.pageCount) {
      page++;
    } else {
      hasMore = false;
    }
  }
}

diagnoseMayowa().catch(console.error);
