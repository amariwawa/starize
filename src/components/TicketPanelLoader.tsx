"use client";

import dynamic from "next/dynamic";

const TicketPanel = dynamic(() => import("@/components/TicketPanel"), {
  ssr: false,
  loading: () => (
    <section className="max-w-7xl mx-auto px-8 py-20">
      <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-2xl p-8 md:p-12 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="h-8 bg-surface-container rounded w-1/3" />
            <div className="h-24 bg-surface-container rounded-lg" />
            <div className="h-24 bg-surface-container rounded-lg" />
            <div className="h-24 bg-surface-container rounded-lg" />
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-surface-container rounded w-1/4" />
            <div className="h-12 bg-surface-container rounded" />
            <div className="h-12 bg-surface-container rounded" />
            <div className="h-32 bg-surface-container rounded-xl" />
          </div>
        </div>
      </div>
    </section>
  ),
});

export default function TicketPanelLoader() {
  return <TicketPanel />;
}
