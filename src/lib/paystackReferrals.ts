"use server";

import { contestants } from "./contestants";

/**
 * Counts ticket sales per contestant as referral, reading DIRECTLY from Paystack.
 * Bypasses the database entirely.
 */

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

function normalizeReferral(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export async function getTicketReferralCounts(): Promise<Record<string, number>> {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Missing PAYSTACK_SECRET_KEY");
  }

  // Build lookup maps from contestants
  const slugMap = new Map<string, string>(); // normalized -> slug
  const nameMap = new Map<string, string>(); // normalized -> slug
  for (const c of contestants) {
    slugMap.set(normalizeReferral(c.slug), c.slug);
    nameMap.set(normalizeReferral(c.name), c.slug);
    // Also add first name only
    const firstName = c.name.split(" ")[0];
    if (firstName) nameMap.set(normalizeReferral(firstName), c.slug);
  }

  let page = 1;
  const perPage = 100;
  const counts: Record<string, number> = {};

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
      const isTicket =
        paymentType === "ticket" ||
        reference.startsWith("ticket_");

      if (!isTicket) continue;

      const referralRaw = getMetaField(metadata, "referral") || "Nil";
      if (!referralRaw || referralRaw === "Nil") continue;

      const normalized = normalizeReferral(referralRaw);
      let matchedSlug: string | undefined;

      // Try matching by slug first, then by name
      matchedSlug = slugMap.get(normalized) || nameMap.get(normalized);

      if (matchedSlug) {
        counts[matchedSlug] = (counts[matchedSlug] || 0) + 1;
      }
    }

    if (transactions.length < perPage) break;
    page++;
  }

  return counts;
}

export async function getTicketReferralCountForContestant(contestantSlug: string): Promise<number> {
  const allCounts = await getTicketReferralCounts();
  return allCounts[contestantSlug] || 0;
}
