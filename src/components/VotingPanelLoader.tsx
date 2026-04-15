"use client";

import dynamic from "next/dynamic";

const VotingPanel = dynamic(() => import("@/components/VotingPanel"), {
  ssr: false,
  loading: () => (
    <section className="max-w-7xl mx-auto px-8 py-20">
      <div className="text-center mb-16">
        <span className="text-primary font-bold uppercase tracking-[0.3em] text-sm">
          Vote and Support
        </span>
        <h2 className="text-4xl md:text-5xl font-black font-headline mt-2 text-on-surface">
          Official Voting Portal
        </h2>
      </div>
      <div className="bg-surface-container-low p-8 md:p-12 rounded-2xl border border-white/5 animate-pulse">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="h-6 bg-surface-container rounded w-1/3" />
          <div className="h-32 bg-surface-container rounded-xl" />
          <div className="h-12 bg-surface-container rounded-lg" />
          <div className="h-48 bg-surface-container rounded-xl" />
        </div>
      </div>
    </section>
  ),
});

export default function VotingPanelLoader() {
  return <VotingPanel />;
}
