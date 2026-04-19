
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !PAYSTACK_SECRET_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TARGET_CONTESTANTS = [
  'rotimi-john-olufela',
  'nisola',
  'owofadeju-mayowa',
  'bikom-helen',
  'eniola-busayo',
  'olutoki-oyinkansola',
];

// Cutoff: 3:13 PM today (2026-04-18)
// 3:13 PM +0100 is 14:13:00 UTC
const CUTOFF_DATE = '2026-04-18T14:13:00Z';

async function fetchPaystackTransactions() {
  console.log(`Fetching Paystack transactions since ${CUTOFF_DATE}...`);
  // Paystack API endpoint for listing transactions
  // https://paystack.com/docs/api/transaction/#list
  const url = `https://api.paystack.co/transaction?from=${encodeURIComponent(CUTOFF_DATE)}&status=success&perPage=100`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Paystack API error: ${err}`);
  }

  const result = await response.json();
  return result.data;
}

function extractVoteData(tx: any) {
  const metadata = tx.metadata || {};
  const reference = tx.reference;
  const amount = tx.amount / 100;
  const email = tx.customer?.email;

  const getMetaField = (name: string) => {
    if (metadata[name]) return metadata[name];
    if (metadata.custom_fields) {
      const f = metadata.custom_fields.find((field: any) => field.variable_name === name);
      return f ? f.value : null;
    }
    return null;
  };

  const type = metadata.type || getMetaField('payment_type');
  const isVotePattern = reference.startsWith('vote_');

  if (type === 'vote' || type === 'voting' || isVotePattern) {
    let contestantSlug = getMetaField('contestant_slug') || getMetaField('slug');
    
    if (!contestantSlug && isVotePattern) {
      const parts = reference.split('_');
      if (parts.length >= 2) {
        contestantSlug = parts[1];
      }
    }

    if (contestantSlug) {
      return {
        full_name: getMetaField('full_name') || 'Unknown',
        email: email,
        contestant_slug: contestantSlug,
        contestant_name: getMetaField('contestant') || 'Unknown',
        votes: parseInt(getMetaField('votes') || '0', 10) || Math.floor(amount / 50),
        amount_naira: amount,
        paystack_reference: reference,
        payment_channel: tx.channel,
        paid_at: tx.paid_at,
      };
    }
  }
  return null;
}

async function sync() {
  try {
    const transactions = await fetchPaystackTransactions();
    console.log(`Found ${transactions.length} successful transactions on Paystack since cutoff.`);

    let newVotesCount = 0;
    let skippedCount = 0;
    const contestantStats: Record<string, number> = {};

    for (const tx of transactions) {
      const voteData = extractVoteData(tx);
      if (!voteData) continue;

      // Removed TARGET_CONTESTANTS filter to sync all contestants as requested

      // 1. Upsert transaction log
      await supabase.from('transactions').upsert({
        reference: tx.reference,
        email: voteData.email,
        amount: voteData.amount_naira,
        status: tx.status,
        paid_at: tx.paid_at,
        metadata: tx.metadata,
        channel: tx.channel,
        currency: tx.currency,
      }, { onConflict: 'reference' });

      // 2. Upsert vote
      // We use upsert with paystack_reference constraint to skip already recorded ones if they are identical, 
      // or update them if they changed (though they shouldn't).
      const { data, error } = await supabase
        .from('votes')
        .upsert({
            full_name: voteData.full_name,
            email: voteData.email,
            contestant_slug: voteData.contestant_slug,
            contestant_name: voteData.contestant_name,
            votes: voteData.votes,
            amount_naira: voteData.amount_naira,
            paystack_reference: voteData.paystack_reference,
            payment_channel: voteData.payment_channel,
        }, { onConflict: 'paystack_reference' });

      if (error) {
        console.error(`Error syncing ${tx.reference}:`, error.message);
      } else {
        newVotesCount++;
        contestantStats[voteData.contestant_slug] = (contestantStats[voteData.contestant_slug] || 0) + voteData.votes;
      }
    }

    console.log('\n--- Sync Results ---');
    console.log(`Processed ${newVotesCount} vote transactions.`);
    console.log('Votes added per contestant (from this batch):');
    Object.entries(contestantStats).forEach(([slug, count]) => {
      console.log(`- ${slug}: ${count} votes`);
    });

  } catch (err: any) {
    console.error('Sync failed:', err.message);
  }
}

sync();
