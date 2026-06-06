"use server";

import { getContestantVotes } from "@/lib/database";

/**
 * Server Action that reads vote counts from Supabase.
 * Fast and persistent — data is kept current by running sync-all.
 */
export async function syncVotesAction(contestantSlug: string) {
  try {
    const votes = await getContestantVotes(contestantSlug);
    return { success: true, votes };
  } catch (error: any) {
    console.error(`VoteAction Error for ${contestantSlug}:`, error.message);
    return { success: false, votes: 0, error: error.message };
  }
}
