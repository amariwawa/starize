"use server";

import { syncPaystackTransactions } from "@/lib/sync";
import { getContestantVotes } from "@/lib/database";

/**
 * Server Action to perform a quick sync from Paystack and return the latest vote count.
 * This satisfies the "Direct from Paystack" requirement by refreshing the database
 * mirror synchronously when the page is viewed.
 */
export async function syncVotesAction(contestantSlug: string) {
  try {
    // 1. Sync the last 150 transactions to ensure absolute accuracy
    // (This covers recent surges and missed webhooks)
    await syncPaystackTransactions(150);

    // 2. Fetch the updated count from our fast database mirror
    const updatedVotes = await getContestantVotes(contestantSlug);

    return {
      success: true,
      votes: updatedVotes,
    };
  } catch (error: any) {
    console.error(`SyncAction Error for ${contestantSlug}:`, error.message);
    // Fallback to current database count if sync fails
    const currentVotes = await getContestantVotes(contestantSlug);
    return {
      success: false,
      votes: currentVotes,
      error: error.message,
    };
  }
}
