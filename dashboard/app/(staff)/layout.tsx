import { LogoutButton } from "@/components/LogoutButton";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="border-b-2 border-ink/10 px-6 py-4 flex items-center justify-between bg-panel">
        <a href="/dashboard" className="font-display text-xl font-semibold text-ink">
          Civic Complaints <span className="text-sm font-body font-normal text-sage">— Staff</span>
        </a>
        <div className="flex gap-6 items-center font-body text-sm">
          <a href="/dashboard" className="text-sage hover:text-civic transition-colors">Complaints</a>
          <a href="/dashboard/map" className="text-sage hover:text-civic transition-colors">Map</a>
          <LogoutButton />
        </div>
      </nav>
      {children}
    </div>
  );
}