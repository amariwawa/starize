"use server";

import { getTicketReferralCountFromDB } from "@/lib/database";

/**
 * Server Action to get ticket referral count from Supabase.
 * Fast and persistent — data is kept current by running sync-all.
 */
export async function getReferralTicketCountAction(contestantSlug: string) {
  try {
    const count = await getTicketReferralCountFromDB(contestantSlug);
    return { success: true, count };
  } catch (error: any) {
    console.error(`ReferralTicketAction Error for ${contestantSlug}:`, error.message);
    return { success: false, count: 0, error: error.message };
  }
}
