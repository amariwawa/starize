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
