"use client";

import dynamic from "next/dynamic";

const VotingPanel = dynamic(() => import("@/components/VotingPanel"), {
  ssr: false,
});

export default function VotingPanelLoader() {
  return <VotingPanel />;
}
