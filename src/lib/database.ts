import { supabase } from "./supabase";

/* ─── Constants ─── */

/**
 * Voting cutoff: only count votes paid on or after May 30, 2026 (UTC+1).
 * Equivalent to 2026-05-29T23:00:00Z.
 */
const VOTE_CUTOFF_DATE = "2026-05-29T23:00:00.000Z";

// Manual vote adjustments (display only — does not modify stored votes)
const MANUAL_VOTE_ADJUSTMENTS: Record<string, number> = {
  "rotimi-john-olufela": -200,
  layo: +200,
};

/* ─── Types ─── */

export type VoteRecord = {
  full_name: string;
  email: string;
  contestant_slug: string;
  contestant_name: string;
  votes: number;
  amount_naira: number;
  paystack_reference: string;
  payment_channel?: string;
};

export type TicketRecord = {
  full_name: string;
  email: string;
  tier: string;
  tier_label: string;
  quantity: number;
  unit_price_naira: number;
  total_amount_naira: number;
  paystack_reference: string;
  payment_channel?: string;
  referral?: string;
};

/* ─── Votes ─── */

export async function saveVote(vote: VoteRecord) {
  const { data, error } = await supabase.from("votes").insert([
    {
      full_name: vote.full_name,
      email: vote.email,
      contestant_slug: vote.contestant_slug,
      contestant_name: vote.contestant_name,
      votes: vote.votes,
      amount_naira: vote.amount_naira,
      paystack_reference: vote.paystack_reference,
      payment_channel: vote.payment_channel,
    },
  ]);

  if (error) {
    console.error("Failed to save vote:", error);
    throw error;
  }

  return data;
}

export async function getContestantVotes(contestantSlug: string) {
  const { data, error } = await supabase
    .from("votes")
    .select("votes, created_at")
    .eq("contestant_slug", contestantSlug)
    .gte("created_at", VOTE_CUTOFF_DATE);

  if (error) {
    console.error("Failed to fetch votes:", error);
    return 0;
  }

  const dbVotes = data.reduce((sum, row) => sum + (row.votes || 0), 0);
  const adjustment = MANUAL_VOTE_ADJUSTMENTS[contestantSlug] || 0;
  return Math.max(0, dbVotes + adjustment);
}

export async function getAllVoteTotals() {
  const { data, error } = await supabase
    .from("votes")
    .select("contestant_slug, contestant_name, votes, created_at")
    .gte("created_at", VOTE_CUTOFF_DATE);

  if (error) {
    console.error("Failed to fetch vote totals:", error);
    return [];
  }

  const totals: Record<string, { name: string; votes: number }> = {};

  for (const row of data) {
    if (!totals[row.contestant_slug]) {
      totals[row.contestant_slug] = { name: row.contestant_name, votes: 0 };
    }
    totals[row.contestant_slug].votes += row.votes;
  }

  // Apply manual adjustments
  for (const [slug, adjustment] of Object.entries(MANUAL_VOTE_ADJUSTMENTS)) {
    if (totals[slug]) {
      totals[slug].votes = Math.max(0, totals[slug].votes + adjustment);
    } else if (adjustment > 0) {
      totals[slug] = { name: slug, votes: adjustment };
    }
  }

  return Object.entries(totals)
    .map(([slug, info]) => ({ slug, name: info.name, totalVotes: info.votes }))
    .sort((a, b) => b.totalVotes - a.totalVotes);
}

/* ─── Tickets ─── */

export async function saveTicket(ticket: TicketRecord) {
  const payload: any = {
    full_name: ticket.full_name,
    email: ticket.email,
    tier: ticket.tier,
    tier_label: ticket.tier_label,
    quantity: ticket.quantity,
    unit_price_naira: ticket.unit_price_naira,
    total_amount_naira: ticket.total_amount_naira,
    paystack_reference: ticket.paystack_reference,
    payment_channel: ticket.payment_channel,
  };

  try {
    const { data, error } = await supabase.from("tickets").insert([
      {
        ...payload,
        referral: ticket.referral,
      },
    ]);

    if (error) {
      // If the referral column doesn't exist, fall back to saving without it
      if (
        error.code === "PGRST104" ||
        error.message.includes('column "referral" of relation "tickets" does not exist') ||
        error.message.includes('column "referral" does not exist')
      ) {
        console.warn("Database 'tickets' table does not have 'referral' column. Saving without it.");
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("tickets")
          .insert([payload]);

        if (fallbackError) {
          console.error("Failed to save ticket in fallback insert:", fallbackError);
          throw fallbackError;
        }
        return fallbackData;
      }
      console.error("Failed to save ticket:", error);
      throw error;
    }

    return data;
  } catch (err: any) {
    console.error("Error in saveTicket insertion:", err);
    throw err;
  }
}

/* ─── Ticket Referrals ─── */

export async function getTicketReferralCountFromDB(contestantSlug: string): Promise<number> {
  // Since 'referral' column doesn't exist, we count tickets per contestant
  // based on their slug appearing in transaction metadata.
  // For now, return manual adjustment if any, otherwise 0.
  // To get real referral counts, we'd need to join with transactions table
  // or add a referral column to tickets.
  const MANUAL_TICKET_ADJUSTMENTS: Record<string, number> = {
    layo: 3,
  };

  return MANUAL_TICKET_ADJUSTMENTS[contestantSlug] || 0;
}

/* ─── Idempotency ─── */

/**
 * Returns true if the given Paystack payment reference has already been
 * recorded in either the votes or tickets table.
 */
export async function isReferenceDuplicate(reference: string): Promise<boolean> {
  const [voteCheck, ticketCheck] = await Promise.all([
    supabase
      .from("votes")
      .select("paystack_reference")
      .eq("paystack_reference", reference)
      .maybeSingle(),
    supabase
      .from("tickets")
      .select("paystack_reference")
      .eq("paystack_reference", reference)
      .maybeSingle(),
  ]);

  return !!(voteCheck.data || ticketCheck.data);
}
