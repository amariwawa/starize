"use server";

/**
 * Reads vote counts DIRECTLY from Paystack transactions.
 * Bypasses the Supabase votes table entirely.
 */

const VOTE_CUTOFF = new Date("2026-05-29T23:00:00.000Z").getTime();

function getMetaField(metadata: any, name: string): string | null {
  if (!metadata) return null;
  if (metadata[name]) return metadata[name];
  if (metadata.custom_fields) {
    const field = metadata.custom_fields.find(
      (f: any) => f.variable_name === name
    );
    return field ? field.value : null;
  }
  return null;
}

export async function getVotesDirectFromPaystack(contestantSlug?: string): Promise<number | Record<string, { name: string; votes: number }>> {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Missing PAYSTACK_SECRET_KEY");
  }

  let page = 1;
  const perPage = 100;
  const totals: Record<string, { name: string; votes: number }> = {};

  while (true) {
    const response = await fetch(
      `https://api.paystack.co/transaction?perPage=${perPage}&page=${page}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("Paystack fetch failed:", response.status);
      break;
    }

    const result = await response.json();
    const transactions = result.data || [];
    if (transactions.length === 0) break;

    for (const tx of transactions) {
      if (tx.status !== "success") continue;

      const reference = tx.reference || "";
      const metadata = tx.metadata || {};
      const paymentType = getMetaField(metadata, "payment_type") || metadata.type;
      const isVote =
        paymentType === "voting" ||
        paymentType === "vote" ||
        reference.startsWith("vote_");

      if (!isVote) continue;

      // Date cutoff
      const paidAt = tx.paid_at ? new Date(tx.paid_at).getTime() : 0;
      if (paidAt < VOTE_CUTOFF) continue;

      let slug =
        getMetaField(metadata, "contestant_slug") ||
        getMetaField(metadata, "slug");
      if (!slug && reference.startsWith("vote_")) {
        const parts = reference.split("_");
        if (parts.length >= 2) slug = parts[1];
      }

      if (!slug) continue;

      const amountNaira = tx.amount / 100;
      const votes =
        parseInt(getMetaField(metadata, "votes") || "0", 10) ||
        Math.floor(amountNaira / 50);

      if (!totals[slug]) {
        totals[slug] = {
          name: getMetaField(metadata, "contestant") || slug,
          votes: 0,
        };
      }
      totals[slug].votes += votes;
    }

    if (transactions.length < perPage) break;
    page++;
  }

  if (contestantSlug) {
    return totals[contestantSlug]?.votes || 0;
  }

  return totals;
}
