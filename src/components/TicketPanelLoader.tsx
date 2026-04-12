"use client";

import dynamic from "next/dynamic";

const TicketPanel = dynamic(() => import("@/components/TicketPanel"), {
  ssr: false,
});

export default function TicketPanelLoader() {
  return <TicketPanel />;
}
