import { ComplaintTable } from "@/components/ComplaintTable";
import { StatsWidget } from "@/components/StatsWidget";

export default function DashboardPage() {
  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl font-semibold text-ink">Complaints</h1>
        
          href={`${process.env.NEXT_PUBLIC_API_URL}/complaints/export/csv`}
          className="text-sm border-2 border-ink/10 px-4 py-2 rounded-md hover:border-civic transition-colors"
        >
          Download CSV
        </a>
      </div>
      <StatsWidget />
      <ComplaintTable />
    </main>
  );
}