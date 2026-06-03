import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Voting cutoff: only count votes paid on or after May 30, 2026 (UTC+1).
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

export async function POST() {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json(
      { success: false, error: "Missing PAYSTACK_SECRET_KEY" },
      { status: 500 }
    );
  }

  let page = 1;
  const perPage = 100;
  let totalProcessed = 0;
  let totalVotesUpserted = 0;
  const contestantSummary: Record<string, number> = {};
  const skippedBeforeCutoff: string[] = [];
  const errors: string[] = [];

  try {
    while (true) {
      const response = await fetch(
        `https://api.paystack.co/transaction?perPage=${perPage}&page=${page}`,
        {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: `Paystack API error: ${response.status}` },
          { status: 500 }
        );
      }

      const result = await response.json();
      const transactions = result.data || [];
      if (transactions.length === 0) break;

      for (const tx of transactions) {
        totalProcessed++;
        const reference = tx.reference || "";
        const metadata = tx.metadata || {};
        const paymentType = getMetaField(metadata, "payment_type") || metadata.type;
        const isVote =
          paymentType === "voting" ||
          paymentType === "vote" ||
          reference.startsWith("vote_");

        if (!isVote || tx.status !== "success") continue;

        // Date cutoff
        const paidAt = tx.paid_at ? new Date(tx.paid_at).getTime() : 0;
        if (paidAt < VOTE_CUTOFF) {
          skippedBeforeCutoff.push(reference);
          continue;
        }

        let contestantSlug =
          getMetaField(metadata, "contestant_slug") ||
          getMetaField(metadata, "slug");
        if (!contestantSlug && reference.startsWith("vote_")) {
          const parts = reference.split("_");
          if (parts.length >= 2) contestantSlug = parts[1];
        }

        if (!contestantSlug) {
          errors.push(`Could not identify contestant for ${reference}`);
          continue;
        }

        const amountNaira = tx.amount / 100;
        const votes =
          parseInt(getMetaField(metadata, "votes") || "0", 10) ||
          Math.floor(amountNaira / 50);

        const voteData = {
          full_name: getMetaField(metadata, "full_name") || "Unknown",
          email: tx.customer?.email || null,
          contestant_slug: contestantSlug,
          contestant_name: getMetaField(metadata, "contestant") || "Unknown",
          votes,
          amount_naira: amountNaira,
          paystack_reference: reference,
          payment_channel: tx.channel,
        };

        const { error: upsertError } = await supabaseAdmin
          .from("votes")
          .upsert(voteData, { onConflict: "paystack_reference" });

        if (upsertError) {
          errors.push(`${reference}: ${upsertError.message}`);
        } else {
          totalVotesUpserted += votes;
          contestantSummary[contestantSlug] =
            (contestantSummary[contestantSlug] || 0) + votes;
        }
      }

      if (transactions.length < perPage) break;
      page++;
    }

    return NextResponse.json({
      success: true,
      totalProcessed,
      totalVotesUpserted,
      skippedBeforeCutoff: skippedBeforeCutoff.length,
      contestantSummary,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error("Backfill error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
