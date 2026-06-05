"use server";

import { getCachedTicketReferrals } from "@/lib/paystackCache";

/**
 * Server Action to get ticket referral count from cached Paystack data.
 * Instant response — no repeated API calls.
 */
export async function getReferralTicketCountAction(contestantSlug: string) {
  try {
    const count = await getCachedTicketReferrals(contestantSlug);
    return { success: true, count: typeof count === "number" ? count : 0 };
  } catch (error: any) {
    console.error(`ReferralTicketAction Error for ${contestantSlug}:`, error.message);
    return { success: false, count: 0, error: error.message };
  }
}
