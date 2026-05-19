import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!PAYSTACK_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const FINALIST_SLUGS = [
  "rotimi-john-olufela",
  "nisola",
  "owofadeju-mayowa",
  "bikom-helen",
  "eniola-busayo",
  "olutoki-oyinkansola",
];

const RESET_TIMESTAMP = new Date("2026-04-18T14:13:00.000Z"); // 3:13 PM WAT

function getField(metadata: any, name: string): string {
  if (!metadata || !metadata.custom_fields) return "";
  const field = metadata.custom_fields.find((f: any) => f.variable_name === name);
  return field ? field.value : "";
}

async function forceSync(pages = 50) {
  console.log(`--- EMERGENCY SYNC STARTING (${pages} pages) ---`);
  let totalVotesSynced = 0;

  for (let page = 1; page <= pages; page++) {
    console.log(`Fetching Paystack transactions (Page ${page})...`);
    const response = await fetch(`https://api.paystack.co/transaction?perPage=50&page=${page}&status=success`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });

    if (!response.ok) break;
    const { data: transactions } = await response.json();
    if (!transactions || transactions.length === 0) break;

    const voteRecords = [];

    for (const tx of transactions) {
      const paidAt = new Date(tx.paid_at);
      if (paidAt < RESET_TIMESTAMP) continue;

      const reference = tx.reference;
      const metadata = tx.metadata || {};
      const paymentType = getField(metadata, 'payment_type') || metadata.type;
      let isVote = paymentType === "voting" || paymentType === "vote" || reference.startsWith("vote_");

      if (isVote) {
        let slug = getField(metadata, "contestant_slug") || getField(metadata, "slug");
        if (!slug && reference.startsWith("vote_")) {
          slug = reference.split("_")[1];
        }

        if (slug && FINALIST_SLUGS.includes(slug)) {
          voteRecords.push({
            full_name: getField(metadata, "full_name") || "Unknown",
            email: tx.customer.email,
            contestant_slug: slug,
            contestant_name: getField(metadata, "contestant") || "Unknown",
            votes: parseInt(getField(metadata, "votes") || "0", 10) || Math.floor((tx.amount/100) / 50),
            amount_naira: tx.amount / 100,
            paystack_reference: reference,
            payment_channel: tx.channel,
            created_at: tx.paid_at
          });
        }
      }
    }

    if (voteRecords.length > 0) {
      const { error } = await supabase.from('votes').upsert(voteRecords, { onConflict: 'paystack_reference' });
      if (error) {
        console.error(`Error upserting records:`, error.message);
      } else {
        totalVotesSynced += voteRecords.length;
        console.log(`Synced ${voteRecords.length} votes from Page ${page}`);
      }
    }
  }

  console.log(`--- EMERGENCY SYNC COMPLETE. Total synced: ${totalVotesSynced} ---`);
}

forceSync().catch(console.error);
