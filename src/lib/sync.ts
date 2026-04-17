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
 * @param perPage Number of transactions to fetch (default 50)
 */
export async function syncPaystackTransactions(perPage = 50) {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Missing PAYSTACK_SECRET_KEY");
  }

  const response = await fetch(`https://api.paystack.co/transaction?perPage=${perPage}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Paystack API error: ${response.status}`);
  }

  const { data: transactions } = await response.json();
  if (!transactions) return 0;

  let processedCount = 0;

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

  return processedCount;
}
