"use server";

import { contestants } from "./contestants";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

let cachedData: {
  votes: Record<string, { name: string; votes: number }>;
  tickets: Record<string, number>;
  fetchedAt: number;
} | null = null;

const CACHE_TTL_MS = 10000; // 10 seconds

function getMetaField(metadata: any, name: string): string | null {
  if (!metadata) return null;
  if (metadata[name]) return metadata[name];
  if (metadata.custom_fields) {
    const field = metadata.custom_fields.find((f: any) => f.variable_name === name);
    return field ? field.value : null;
  }
  return null;
}

function normalizeReferral(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

async function fetchAllPaystackTransactions(): Promise<any[]> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Missing PAYSTACK_SECRET_KEY");
  }

  const all: any[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetch(
      `https://api.paystack.co/transaction?perPage=${perPage}&page=${page}&from=2026-05-01T00:00:00.000Z`,
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

    all.push(...transactions);

    if (transactions.length < perPage) break;
    page++;
  }

  return all;
}

async function refreshCache() {
  const transactions = await fetchAllPaystackTransactions();

  const votes: Record<string, { name: string; votes: number }> = {};
  const tickets: Record<string, number> = {};

  // Build lookup maps for ticket referrals
  const slugMap = new Map<string, string>();
  const nameMap = new Map<string, string>();
  for (const c of contestants) {
    slugMap.set(normalizeReferral(c.slug), c.slug);
    nameMap.set(normalizeReferral(c.name), c.slug);
    const firstName = c.name.split(" ")[0];
    if (firstName) nameMap.set(normalizeReferral(firstName), c.slug);
  }

  const VOTE_CUTOFF = new Date("2026-05-29T23:00:00.000Z").getTime();

  for (const tx of transactions) {
    if (tx.status !== "success") continue;

    const reference = tx.reference || "";
    const metadata = tx.metadata || {};
    const paymentType = getMetaField(metadata, "payment_type") || metadata.type;

    // Count votes
    const isVote =
      paymentType === "voting" ||
      paymentType === "vote" ||
      reference.startsWith("vote_");

    if (isVote) {
      const paidAt = tx.paid_at ? new Date(tx.paid_at).getTime() : 0;
      if (paidAt >= VOTE_CUTOFF) {
        let slug =
          getMetaField(metadata, "contestant_slug") ||
          getMetaField(metadata, "slug");
        if (!slug && reference.startsWith("vote_")) {
          const parts = reference.split("_");
          if (parts.length >= 2) slug = parts[1];
        }

        if (slug) {
          const amountNaira = tx.amount / 100;
          const voteCount =
            parseInt(getMetaField(metadata, "votes") || "0", 10) ||
            Math.floor(amountNaira / 50);

          if (!votes[slug]) {
            votes[slug] = {
              name: getMetaField(metadata, "contestant") || slug,
              votes: 0,
            };
          }
          votes[slug].votes += voteCount;
        }
      }
    }

    // Count ticket referrals
    const isTicket =
      paymentType === "ticket" || reference.startsWith("ticket_");

    if (isTicket) {
      const referralRaw = getMetaField(metadata, "referral") || "Nil";
      if (referralRaw && referralRaw !== "Nil") {
        const normalized = normalizeReferral(referralRaw);
        const matchedSlug = slugMap.get(normalized) || nameMap.get(normalized);
        if (matchedSlug) {
          // Count quantity, not just 1 per transaction
          const qty = Math.max(1, parseInt(getMetaField(metadata, "quantity") || "1", 10));
          tickets[matchedSlug] = (tickets[matchedSlug] || 0) + qty;
        }
      }
    }
  }

  cachedData = { votes, tickets, fetchedAt: Date.now() };
  console.log(`[PaystackCache] Refreshed: ${Object.keys(votes).length} contestants with votes, ${Object.keys(tickets).length} with ticket referrals`);
}

async function ensureCache() {
  if (!cachedData || Date.now() - cachedData.fetchedAt > CACHE_TTL_MS) {
    await refreshCache();
  }
}

export async function getCachedVotes(contestantSlug?: string): Promise<number | Record<string, { name: string; votes: number }>> {
  await ensureCache();
  if (contestantSlug) {
    return cachedData!.votes[contestantSlug]?.votes || 0;
  }
  return cachedData!.votes;
}

export async function getCachedTicketReferrals(contestantSlug?: string): Promise<number | Record<string, number>> {
  await ensureCache();
  if (contestantSlug) {
    return cachedData!.tickets[contestantSlug] || 0;
  }
  return cachedData!.tickets;
}
