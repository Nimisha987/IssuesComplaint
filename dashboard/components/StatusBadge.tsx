const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  received: { color: "text-sage border-sage", label: "Received" },
  verified: { color: "text-civic border-civic", label: "Verified" },
  assigned: { color: "text-[#8A6D1F] border-[#8A6D1F]", label: "Assigned" },
  in_progress: { color: "text-hazard border-hazard", label: "In Progress" },
  resolved: { color: "text-civic border-civic bg-civic/10", label: "Resolved" },
  duplicate: { color: "text-sage border-sage", label: "Duplicate" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { color: "text-sage border-sage", label: status };
  return <span className={`stamp ${config.color}`}>{config.label}</span>;
}