import * as dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function findMissingVotes() {
  let page = 1;
  let hasMore = true;
  
  console.log(`--- Searching for successful transactions not recorded as votes/tickets ---`);

  while (hasMore && page <= 20) {
    const response = await fetch(`https://api.paystack.co/transaction?perPage=50&page=${page}&status=success`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    if (!response.ok) break;

    const body = await response.json();
    const transactions = body.data;

    if (!transactions || transactions.length === 0) break;

    for (const tx of transactions) {
      const reference = tx.reference;
      
      // Check if already in votes or tickets
      const { data: v } = await supabase.from('votes').select('paystack_reference').eq('paystack_reference', reference).maybeSingle();
      const { data: t } = await supabase.from('tickets').select('paystack_reference').eq('paystack_reference', reference).maybeSingle();
      
      if (!v && !t) {
        console.log(`[MISSING] Ref: ${reference}, Amount: ${tx.amount/100}, Email: ${tx.customer.email}`);
        console.log(`Metadata: ${JSON.stringify(tx.metadata)}`);
        console.log('---');
      }
    }

    if (body.meta && page < body.meta.pageCount) {
      page++;
    } else {
      hasMore = false;
    }
  }
}

findMissingVotes().catch(console.error);
