
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const CUTOFF_DATE = '2026-04-18T14:12:00Z'; // The reset time

async function fullAudit(slug: string) {
  let page = 1;
  let hasMore = true;
  let totalVotes = 0;
  let txCount = 0;

  console.log(`Auditing ALL Paystack transactions for ${slug} since ${CUTOFF_DATE}...`);

  while (hasMore) {
    const url = `https://api.paystack.co/transaction?perPage=100&page=${page}&status=success`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
    });
    const result = await response.json();
    const transactions = result.data || [];
    
    if (transactions.length === 0) break;

    for (const tx of transactions) {
      const txDate = new Date(tx.paid_at).getTime();
      const cutoffTime = new Date(CUTOFF_DATE).getTime();
      
      // Stop if we hit transactions BEFORE the cutoff (Paystack returns newest first)
      if (txDate < cutoffTime) {
        hasMore = false;
        break;
      }

      const metadata = tx.metadata || {};
      const getMetaField = (name: string) => {
        if (metadata[name]) return metadata[name];
        if (metadata.custom_fields) {
          const f = metadata.custom_fields.find((field: any) => field.variable_name === name);
          return f ? f.value : null;
        }
        return null;
      };

      const type = metadata.type || getMetaField('payment_type');
      const reference = tx.reference || "";
      const isVote = type === 'vote' || type === 'voting' || reference.startsWith('vote_');

      if (isVote) {
        let contestantSlug = getMetaField('contestant_slug') || getMetaField('slug');
        if (!contestantSlug && reference.startsWith('vote_')) {
          contestantSlug = reference.split('_')[1];
        }

        if (contestantSlug === slug) {
          const votes = parseInt(getMetaField('votes') || '0', 10) || Math.floor((tx.amount/100) / 50);
          totalVotes += votes;
          txCount++;
          // console.log(`[PASS] ${tx.paid_at}: ${votes} votes (${reference})`);
        }
      }
    }

    if (transactions.length < 100) hasMore = false;
    page++;
    if (page > 20) break; // Absolute limit
  }

  console.log(`\nAUDIT RESULT FOR ${slug}:`);
  console.log(`Total Transactions on Paystack since cutoff: ${txCount}`);
  console.log(`Total Votes on Paystack since cutoff: ${totalVotes}`);
}

fullAudit('nisola').catch(console.error);
