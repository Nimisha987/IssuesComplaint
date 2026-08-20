"use client";

import { useEffect, useState } from "react";
import { fetchAnalytics } from "@/lib/api";
import { AnalyticsSummary } from "@/lib/types";

export function StatsWidget() {
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    fetchAnalytics().then(setStats).catch(console.error);
  }, []);

  if (!stats) return null;

  const cards = [
    { label: "Total filed", value: stats.total_complaints },
    { label: "Resolved", value: stats.resolved },
    { label: "Open", value: stats.open },
    { label: "Overdue", value: stats.overdue, alert: stats.overdue > 0 },
    { label: "Avg. resolution", value: stats.avg_resolution_hours ? `${stats.avg_resolution_hours}h` : "—" },
    { label: "Last 7 days", value: stats.last_7_days },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`border-2 rounded-lg p-4 bg-white ${card.alert ? "border-hazard" : "border-ink/10"}`}
        >
          <p className="text-xs uppercase tracking-wide text-sage font-body">{card.label}</p>
          <p className={`font-display text-2xl font-semibold mt-1 ${card.alert ? "text-hazard" : "text-ink"}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}