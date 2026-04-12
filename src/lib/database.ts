import { supabase } from "./supabase";

/* ─── Types ─── */

export type VoteRecord = {
  email: string;
  contestant_slug: string;
  contestant_name: string;
  votes: number;
  amount_naira: number;
  paystack_reference: string;
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
};

/* ─── Votes ─── */

export async function saveVote(vote: VoteRecord) {
  const { data, error } = await supabase.from("votes").insert([
    {
      email: vote.email,
      contestant_slug: vote.contestant_slug,
      contestant_name: vote.contestant_name,
      votes: vote.votes,
      amount_naira: vote.amount_naira,
      paystack_reference: vote.paystack_reference,
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
    .select("votes")
    .eq("contestant_slug", contestantSlug);

  if (error) {
    console.error("Failed to fetch votes:", error);
    return 0;
  }

  return data.reduce((sum, row) => sum + (row.votes || 0), 0);
}

export async function getAllVoteTotals() {
  const { data, error } = await supabase
    .from("votes")
    .select("contestant_slug, contestant_name, votes");

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
    },
  ]);

  if (error) {
    console.error("Failed to save ticket:", error);
    throw error;
  }

  return data;
}
