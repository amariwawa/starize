"use server";

import { getTicketReferralCountForContestant } from "@/lib/paystackReferrals";

/**
 * Server Action to get ticket referral count for a contestant directly from Paystack.
 */
export async function getReferralTicketCountAction(contestantSlug: string) {
  try {
    const count = await getTicketReferralCountForContestant(contestantSlug);
    return { success: true, count };
  } catch (error: any) {
    console.error(`ReferralTicketAction Error for ${contestantSlug}:`, error.message);
    return { success: false, count: 0, error: error.message };
  }
}
