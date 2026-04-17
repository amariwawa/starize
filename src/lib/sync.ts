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
      const email = tx.customer.email;
      const amountNaira = tx.amount / 100;

      // 1. Log the transaction
      const txData = {
        reference: tx.reference,
        email,
        amount: amountNaira,
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
        const reference = tx.reference || "";

        // MULTI-LAYERED IDENTIFICATION:
        // Layer 1: Explicit metadata
        let isVote = paymentType === "voting" || paymentType === "vote";
        
        // Layer 2: Reference pattern (starts with vote_)
        if (!isVote && reference.startsWith("vote_")) {
          isVote = true;
          console.log(`Sync: Identified vote by reference pattern: ${reference}`);
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

            await supabaseAdmin.from("votes").upsert(voteData, { onConflict: "paystack_reference" });
            console.log(`Sync: Recorded ${voteData.votes} votes for ${contestantSlug}`);
          } else {
            console.warn(`Sync: Failed to identify contestant for vote ref: ${reference}`);
          }
        } else if (paymentType === "ticket" || reference.startsWith("ticket_")) {
          let tier = getField(metadata, "ticket_tier") || "unknown";
          if (tier === "unknown" && reference.startsWith("ticket_")) {
             const parts = reference.split("_");
             if (parts.length >= 2) tier = parts[1];
          }

          const qty = parseInt(getField(metadata, "quantity") || "1", 10);
          const ticketData = {
            full_name: getField(metadata, "full_name") || "Unknown",
            email,
            tier,
            tier_label: getField(metadata, "tier_label") || "Unknown",
            quantity: qty,
            unit_price_naira: amountNaira / qty,
            total_amount_naira: amountNaira,
            paystack_reference: reference,
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
