import { supabase } from "./supabase";

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
};

/* ─── Constants ─── */

/**
 * Cut-off for the "Clean Scale" reset on April 18, 2026, at 3:13 PM GMT+1.
 * Votes before this time for specific finalists will be ignored in the totals.
 */
const VOTE_RESET_TIMESTAMP = "2026-04-18T14:13:00.000Z";

const RESET_CONTESTANT_SLUGS = [
  "rotimi-john-olufela",
  "nisola",
  "owofadeju-mayowa",
  "bikom-helen",
  "eniola-busayo",
  "olutoki-oyinkansola",
];

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
  const query = supabase
    .from("votes")
    .select("votes, created_at")
    .eq("contestant_slug", contestantSlug);

  // Apply reset filter for designated contestants
  if (RESET_CONTESTANT_SLUGS.includes(contestantSlug)) {
    query.gte("created_at", VOTE_RESET_TIMESTAMP);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch votes:", error);
    return 0;
  }

  return data.reduce((sum, row) => sum + (row.votes || 0), 0);
}

export async function getAllVoteTotals() {
  const { data, error } = await supabase
    .from("votes")
    .select("contestant_slug, contestant_name, votes, created_at");

  if (error) {
    console.error("Failed to fetch vote totals:", error);
    return [];
  }

  const totals: Record<string, { name: string; votes: number }> = {};
  const resetCutoff = Date.parse(VOTE_RESET_TIMESTAMP);

  for (const row of data) {
    const isResetContestant = RESET_CONTESTANT_SLUGS.includes(row.contestant_slug);
    
    // Filter out historical votes for reset contestants
    if (isResetContestant && row.created_at) {
      const voteTime = Date.parse(row.created_at);
      if (voteTime < resetCutoff) continue;
    }

    if (!totals[row.contestant_slug]) {
      totals[row.contestant_slug] = { name: row.contestant_name, votes: 0 };
    }
    totals[row.contestant_slug].votes += row.votes;
  }

  return Object.entries(totals)
    .map(([slug, info]) => ({ slug, name: info.name, totalVotes: info.votes }))
    .sort((a, b) => b.totalVotes - a.totalVotes);
}

/* ─── Tickets ─── */

export async function saveTicket(ticket: TicketRecord) {
  const { data, error } = await supabase.from("tickets").insert([
    {
      full_name: ticket.full_name,
      email: ticket.email,
      tier: ticket.tier,
      tier_label: ticket.tier_label,
      quantity: ticket.quantity,
      unit_price_naira: ticket.unit_price_naira,
      total_amount_naira: ticket.total_amount_naira,
      paystack_reference: ticket.paystack_reference,
      payment_channel: ticket.payment_channel,
    },
  ]);

  if (error) {
    console.error("Failed to save ticket:", error);
    throw error;
  }

  return data;
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
