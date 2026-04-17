import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fetchPaystackTransactions(page = 1) {
  console.log(`Fetching Paystack transactions (Page ${page})...`);
  const response = await fetch(`https://api.paystack.co/transaction?perPage=50&page=${page}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Paystack API error: ${response.status} ${errorBody}`);
  }

  return response.json();
}

/**
 * Helper to pull a value from Paystack custom_fields
 */
function getField(metadata: any, name: string): string {
  if (!metadata || !metadata.custom_fields) return "";
  const field = metadata.custom_fields.find((f: any) => f.variable_name === name);
  return field ? field.value : "";
}

async function backfill() {
  let page = 1;
  let hasMore = true;
  let totalProcessed = 0;

  console.log('--- Starting Paystack Backfill ---');

  while (hasMore) {
    const response = await fetchPaystackTransactions(page);
    const transactions = response.data;

    if (!transactions || transactions.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`Processing ${transactions.length} transactions...`);

    for (const tx of transactions) {
      // 1. Map and Upsert to transactions table
      const txData = {
        reference: tx.reference,
        email: tx.customer.email,
        amount: tx.amount / 100,
        status: tx.status,
        paid_at: tx.paid_at,
        metadata: tx.metadata || {},
        channel: tx.channel,
        currency: tx.currency,
      };

      const { error: txError } = await supabase
        .from('transactions')
        .upsert(txData, { onConflict: 'reference' });

      if (txError) {
        console.error(`Failed to upsert transaction ${tx.reference}:`, txError.message);
        continue;
      }

      // 2. Map and Upsert to votes/tickets tables if successful
      if (tx.status === 'success') {
        const metadata = tx.metadata || {};
        const paymentType = getField(metadata, 'payment_type') || metadata.type;
        const reference = tx.reference || "";
        const email = tx.customer.email;
        const amountNaira = tx.amount / 100;

        // MULTI-LAYERED IDENTIFICATION:
        // Layer 1: Explicit metadata
        let isVote = paymentType === "voting" || paymentType === "vote";
        
        // Layer 2: Reference pattern (starts with vote_)
        if (!isVote && reference.startsWith("vote_")) {
          isVote = true;
          console.log(`Backfill: Identified vote by reference pattern: ${reference}`);
        }

        if (isVote) {
          // Identify contestant slug via metadata or reference parsing
          let contestantSlug = getField(metadata, "contestant_slug") || getField(metadata, "slug");
          
          if (!contestantSlug && reference.startsWith("vote_")) {
            // Extract from vote_SLUG_TIMESTAMP
            const parts = reference.split("_");
            if (parts.length >= 2) {
              contestantSlug = parts[1];
            }
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

            const { error: voteError } = await supabase
              .from('votes')
              .upsert(voteData, { onConflict: 'paystack_reference' });
            
            if (voteError) {
               console.error(`Backfill: Failed to upsert vote ${reference}:`, voteError.message);
            } else {
               console.log(`Backfill: Recorded ${voteData.votes} votes for ${contestantSlug}`);
            }
          } else {
            console.warn(`Backfill: Failed to identify contestant for vote ref: ${reference}`);
          }
        } else if (paymentType === 'ticket' || reference.startsWith("ticket_")) {
          let tier = getField(metadata, "ticket_tier") || "unknown";
          if (tier === "unknown" && reference.startsWith("ticket_")) {
             const parts = reference.split("_");
             if (parts.length >= 2) tier = parts[1];
          }

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

          const { error: ticketError } = await supabase
            .from('tickets')
            .upsert(ticketData, { onConflict: 'paystack_reference' });
          
          if (ticketError) {
            console.error(`Backfill: Failed to upsert ticket ${reference}:`, ticketError.message);
          }
        }
      }

      totalProcessed++;
    }

    const meta = response.meta;
    if (meta && meta.page < meta.pageCount) {
      page++;
    } else {
      hasMore = false;
    }
  }

  console.log(`--- Backfill Complete. Total Processed: ${totalProcessed} ---`);
}

backfill().catch((err) => {
  console.error('Fatal Error during backfill:', err);
  process.exit(1);
});
