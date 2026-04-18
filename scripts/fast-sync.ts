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
  const response = await fetch(`https://api.paystack.co/transaction?perPage=50&page=${page}&status=success`, {
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

function getField(metadata: any, name: string): string {
  if (!metadata || !metadata.custom_fields) return "";
  const field = metadata.custom_fields.find((f: any) => f.variable_name === name);
  return field ? field.value : "";
}

async function fastSync(maxPages = 2) {
  let page = 1;
  let totalProcessed = 0;
  let newVotesCount = 0;

  console.log(`--- Starting Fast Sync (Limit: ${maxPages} pages) ---`);

  while (page <= maxPages) {
    try {
        const response = await fetchPaystackTransactions(page);
        const transactions = response.data;

        if (!transactions || transactions.length === 0) break;

        for (const tx of transactions) {
            const reference = tx.reference;
            
            // Check if already processed to avoid redundant work
            const { data: existing } = await supabase
                .from('transactions')
                .select('reference')
                .eq('reference', reference)
                .maybeSingle();

            if (existing) {
                // If we hit an existing transaction in the first few pages, 
                // we've likely caught up to the last sync. 
                // But we'll continue for the full page just to be safe.
                continue;
            }

            // Map and Upsert to transactions table
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

            await supabase.from('transactions').upsert(txData, { onConflict: 'reference' });

            // Handle Votes
            const metadata = tx.metadata || {};
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
                        email: tx.customer.email,
                        contestant_slug: contestantSlug,
                        contestant_name: getField(metadata, "contestant") || "Unknown",
                        votes: parseInt(getField(metadata, "votes") || "0", 10) || Math.floor((tx.amount/100) / 50),
                        amount_naira: tx.amount / 100,
                        paystack_reference: reference,
                        payment_channel: tx.channel,
                    };

                    await supabase.from('votes').upsert(voteData, { onConflict: 'paystack_reference' });
                    newVotesCount++;
                    console.log(`[NEW] Recorded votes for ${contestantSlug}`);
                }
            }

            totalProcessed++;
        }

        page++;
    } catch (err) {
        console.error(`Error on Page ${page}:`, err);
        // Retry logic or just skip
        break;
    }
  }

  console.log(`--- Sync Complete. New records found: ${newVotesCount} ---`);
}

fastSync().catch(console.error);
