import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

async function auditTransactions() {
  const response = await fetch(`https://api.paystack.co/transaction?perPage=100&status=success`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });

  const data = await response.json();
  const txs = data.data;

  console.log(`Auditing ${txs.length} transactions...`);
  
  txs.forEach((tx: any) => {
    const metadata = tx.metadata || {};
    const fields = metadata.custom_fields || [];
    const contestant = fields.find((f: any) => f.variable_name === 'contestant')?.value;
    const slug = fields.find((f: any) => f.variable_name === 'contestant_slug')?.value;
    const type = fields.find((f: any) => f.variable_name === 'payment_type')?.value;

    if (type === 'voting' || tx.reference.startsWith('vote_')) {
        console.log(`REF: ${tx.reference} | CONTESTANT: ${contestant} | SLUG: ${slug} | TIME: ${tx.paid_at}`);
    }
  });
}

auditTransactions().catch(console.error);
