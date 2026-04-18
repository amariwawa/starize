import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function getField(metadata: any, name: string): string {
  if (!metadata || !metadata.custom_fields) return "";
  const field = metadata.custom_fields.find((f: any) => f.variable_name === name);
  return field ? field.value : "";
}

async function deepAuditSync() {
  console.log('--- Phase 1: Downloading current Supabase references ---');
  const { data: vData } = await supabase.from('votes').select('paystack_reference');
  const { data: tData } = await supabase.from('tickets').select('paystack_reference');
  
  const existingRefs = new Set([
    ...(vData?.map(v => v.paystack_reference) || []),
    ...(tData?.map(t => t.paystack_reference) || [])
  ]);

  console.log(`Found ${existingRefs.size} recorded transactions in Supabase.`);

  let page = 1;
  let hasMore = true;
  let totalProcessed = 0;
  let totalSynced = 0;

  console.log('\n--- Phase 2: Starting Global Audit & Sync ---');

  while (hasMore && page <= 25) { // Up to 1250 transactions
    const response = await fetch(`https://api.paystack.co/transaction?perPage=50&page=${page}&status=success`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    if (!response.ok) break;
    const body = await response.json();
    const transactions = body.data || [];

    if (transactions.length === 0) break;

    console.log(`Auditing Page ${page} (${transactions.length} successful items)...`);

    for (const tx of transactions) {
      if (existingRefs.has(tx.reference)) {
        totalProcessed++;
        continue;
      }

      console.log(`[SYNC] Missing transaction found: ${tx.reference}`);
      
      const metadata = tx.metadata || {};
      const amountNaira = tx.amount / 100;
      const email = tx.customer.email;
      const reference = tx.reference;

      // 1. Record in transactions table first
      await supabase.from('transactions').upsert({
        reference,
        email,
        amount: amountNaira,
        status: tx.status,
        paid_at: tx.paid_at,
        metadata,
        channel: tx.channel,
        currency: tx.currency
      });

      // 2. Identify type
      const paymentType = getField(metadata, 'payment_type') || metadata.type;
      let isVote = paymentType === "voting" || paymentType === "vote" || reference.startsWith("vote_");
      
      if (isVote) {
        let contestantSlug = getField(metadata, "contestant_slug") || getField(metadata, "slug");
        if (!contestantSlug && reference.startsWith("vote_")) {
          contestantSlug = reference.split("_")[1];
        }

        if (contestantSlug) {
          const voteData = {
            full_name: getField(metadata, "full_name") || "Unknown",
            email,
            contestant_slug: contestantSlug,
            contestant_name: getField(metadata, "contestant") || "Unknown",
            votes: parseInt(getField(metadata, "votes") || "0", 10) || Math.floor(amountNaira / 50),
            amount_naira: amountNaira,
            paystack_reference: reference,
            payment_channel: tx.channel,
          };

          const { error } = await supabase.from('votes').upsert(voteData);
          if (error) console.error(`   Error syncing vote ${reference}:`, error.message);
          else {
            console.log(`   + Recorded ${voteData.votes} votes for ${contestantSlug}`);
            totalSynced++;
          }
        }
      } else if (paymentType === "ticket" || reference.startsWith("ticket_")) {
        // Handle tickets if missing
        let tier = getField(metadata, "ticket_tier") || "unknown";
        const qty = parseInt(getField(metadata, 'quantity') || '1', 10);
        const ticketData = {
          full_name: getField(metadata, 'full_name') || 'Unknown',
          email,
          tier,
          tier_label: getField(metadata, 'tier_label') || 'Unknown',
          quantity: qty,
          unit_price_naira: amountNaira / qty,
          total_amount_naira: amountNaira,
          paystack_reference: reference,
          payment_channel: tx.channel,
        };
        await supabase.from('tickets').upsert(ticketData);
        console.log(`   + Recorded ticket for ${email}`);
        totalSynced++;
      }

      totalProcessed++;
    }

    if (body.meta && page < body.meta.pageCount) {
      page++;
    } else {
      hasMore = false;
    }
  }

  console.log(`\n--- Audit Complete ---`);
  console.log(`Items processed: ${totalProcessed}`);
  console.log(`New items synced: ${totalSynced}`);
}

deepAuditSync().catch(console.error);
