// Cache-bust redeploy: 2026-04-19T23:42:00
import App from "@/App";
import VotingPanelLoader from "@/components/VotingPanelLoader";

export default function VotingPage() {
  return (
    <App>
      <main className="pt-24 pb-20">
        <VotingPanelLoader />
      </main>
    </App>
  );
}
