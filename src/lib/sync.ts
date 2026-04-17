import { supabaseAdmin } from "./supabase";

/**
 * Helper to pull a value from Paystack custom_fields
 */
function getField(metadata: any, name: string): string {
  if (!metadata || !metadata.custom_fields) return "";
  const field = metadata.custom_fields.find((f: any) => f.variable_name === name);
  return field ? field.value : "";
}

/**
 * Syncs the most recent transactions from Paystack to Supabase.
 * Supports pagination for deep syncing.
 * @param limit Total number of transactions to fetch (default 50)
 */
export async function syncPaystackTransactions(limit = 50) {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Missing PAYSTACK_SECRET_KEY");
  }

  let processedCount = 0;
  let page = 1;
  const perPage = 100; // Max allowed by Paystack

  while (processedCount < limit) {
    const fetchCount = Math.min(perPage, limit - processedCount);
    const response = await fetch(
      `https://api.paystack.co/transaction?perPage=${fetchCount}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Paystack API error: ${response.status}`);
    }

    const { data: transactions } = await response.json();
    if (!transactions || transactions.length === 0) break;

    for (const tx of transactions) {
      // 1. Log the transaction
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

      const { error: txError } = await supabaseAdmin
        .from("transactions")
        .upsert(txData, { onConflict: "reference" });

      if (txError) {
        console.error(`Sync: Failed to upsert transaction ${tx.reference}:`, txError.message);
        continue;
      }

      // 2. Perform table routing for successful payments
      if (tx.status === "success") {
        const metadata = tx.metadata || {};
        const paymentType = getField(metadata, "payment_type") || metadata.type;

        if (paymentType === "voting" || paymentType === "vote") {
          const voteData = {
            full_name: getField(metadata, "full_name") || "Unknown",
            email: tx.customer.email,
            contestant_slug: getField(metadata, "contestant_slug") || "unknown",
            contestant_name: getField(metadata, "contestant") || "Unknown",
            votes: parseInt(getField(metadata, "votes") || "0", 10),
            amount_naira: tx.amount / 100,
            paystack_reference: tx.reference,
            payment_channel: tx.channel,
          };

          await supabaseAdmin.from("votes").upsert(voteData, { onConflict: "paystack_reference" });
        } else if (paymentType === "ticket") {
          const qty = parseInt(getField(metadata, "quantity") || "1", 10);
          const ticketData = {
            full_name: getField(metadata, "full_name") || "Unknown",
            email: tx.customer.email,
            tier: getField(metadata, "ticket_tier") || "unknown",
            tier_label: getField(metadata, "tier_label") || "Unknown",
            quantity: qty,
            unit_price_naira: tx.amount / 100 / qty,
            total_amount_naira: tx.amount / 100,
            paystack_reference: tx.reference,
            payment_channel: tx.channel,
          };

          await supabaseAdmin.from("tickets").upsert(ticketData, { onConflict: "paystack_reference" });
        }
      }
      processedCount++;
    }

    if (transactions.length < fetchCount) break; // No more data
    page++;
  }

  return processedCount;
}

/**
 * Fetches EVERY single transaction from history.
 * Use this only for one-time backfills or diagnostics.
 */
export async function syncAllTransactions() {
  return syncPaystackTransactions(10000); // Effectively "all" for most accounts
}
