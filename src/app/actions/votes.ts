"use server";

import { getCachedVotes } from "@/lib/paystackCache";

/**
 * Server Action that reads vote counts from cached Paystack data.
 * Instant response — no repeated API calls.
 */
export async function syncVotesAction(contestantSlug: string) {
  try {
    const votes = await getCachedVotes(contestantSlug);

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
