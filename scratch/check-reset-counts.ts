import { getContestantVotes } from "./src/lib/database";

const RESET_SLUGS = [
  "rotimi-john-olufela",
  "nisola",
  "owofadeju-mayowa",
  "bikom-helen",
  "eniola-busayo",
  "olutoki-oyinkansola"
];

async function check() {
  console.log("Current Vote Counts (Before Reset Logic):");
  for (const slug of RESET_SLUGS) {
    const votes = await getContestantVotes(slug);
    console.log(`${slug}: ${votes}`);
  }
}

check();
