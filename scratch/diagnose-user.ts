import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

async function diagnoseUser(searchName: string) {
  console.log(`--- Diagnostics for ${searchName} ---`);
  let page = 1;
  let hasMore = true;
  let matchCount = 0;

  while (hasMore) {
    const response = await fetch(`https://api.paystack.co/transaction?perPage=100&page=${page}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    const { data, meta } = await response.json();

    if (!data || data.length === 0) break;

    for (const tx of data) {
      const email = tx.customer.email.toLowerCase();
      const metadata = JSON.stringify(tx.metadata || {}).toLowerCase();
      const customerName = `${tx.customer.first_name || ''} ${tx.customer.last_name || ''}`.toLowerCase();

      if (email.includes(searchName) || metadata.includes(searchName) || customerName.includes(searchName)) {
        console.log("MATCH FOUND:");
        console.log(JSON.stringify(tx, null, 2));
        matchCount++;
      }
    }

    if (meta.page < meta.pageCount) {
      page++;
    } else {
      hasMore = false;
    }
  }
  console.log(`Total matches for "${searchName}": ${matchCount}`);
}

diagnoseUser('adekoya').catch(console.error);
