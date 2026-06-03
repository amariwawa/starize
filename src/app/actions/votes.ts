"use server";

import { getVotesDirectFromPaystack } from "@/lib/paystackVotes";

/**
 * Server Action that reads vote counts DIRECTLY from Paystack.
 * Bypasses the Supabase votes table entirely.
 */
export async function syncVotesAction(contestantSlug: string) {
  try {
    const votes = await getVotesDirectFromPaystack(contestantSlug);

    return {
      success: true,
      votes: typeof votes === "number" ? votes : 0,
    };
  } catch (error: any) {
    console.error(`SyncAction Error for ${contestantSlug}:`, error.message);
    return {
      success: false,
      votes: 0,
      error: error.message,
    };
  }
}
