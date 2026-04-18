import * as dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fastDiagnostic() {
  console.log('--- Phase 1: Downloading current Supabase references ---');
  const { data: votes } = await supabase.from('votes').select('paystack_reference');
  const { data: tickets } = await supabase.from('tickets').select('paystack_reference');
  
  const existingRefs = new Set([
    ...(votes?.map(v => v.paystack_reference) || []),
    ...(tickets?.map(t => t.paystack_reference) || [])
  ]);

  console.log(`Found ${existingRefs.size} recorded transactions in Supabase.`);

  console.log('--- Phase 2: Fetching ALL Paystack Success records ---');
  let page = 1;
  let allMissing: any[] = [];
  let hasMore = true;

  while (hasMore && page <= 15) {
    const response = await fetch(`https://api.paystack.co/transaction?perPage=50&page=${page}&status=success`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const body = await response.json();
    const transactions = body.data || [];
    
    if (transactions.length === 0) break;

    const missingInPage = transactions.filter((tx: any) => !existingRefs.has(tx.reference));
    allMissing.push(...missingInPage);

    if (body.meta && page < body.meta.pageCount) {
      page++;
    } else {
      hasMore = false;
    }
  }

  console.log(`\nFound ${allMissing.length} missing transactions in total across ${page} pages.`);
  
  const mayowaMissing = allMissing.filter((tx: any) => {
    const metadataStr = JSON.stringify(tx.metadata || {});
    const reference = tx.reference || "";
    return metadataStr.toLowerCase().includes('mayowa') || 
           metadataStr.toLowerCase().includes('owofadeju') ||
           reference.toLowerCase().includes('mayowa') ||
           reference.toLowerCase().includes('owofadeju');
  });

  if (mayowaMissing.length > 0) {
    console.log(`\n!!! ALERT: Found ${mayowaMissing.length} missing transactions for MAYOWA !!!`);
    mayowaMissing.forEach((tx: any) => {
      console.log(`- Ref: ${tx.reference}, Status: ${tx.status}, Amount: ${tx.amount/100}, metadata: ${JSON.stringify(tx.metadata)}`);
    });
  } else {
    console.log('\nNo missing votes found for Mayowa in the entire transaction history.');
  }

  if (allMissing.length > 0) {
    console.log(`\nTotal Missing: ${allMissing.length}`);
    console.log('Sample of other missing transactions:');
    allMissing.slice(0, 10).forEach((tx: any) => {
       console.log(`- Ref: ${tx.reference}, Amount: ${tx.amount/100}, Email: ${tx.customer.email}`);
    });
  }
}

fastDiagnostic().catch(console.error);
