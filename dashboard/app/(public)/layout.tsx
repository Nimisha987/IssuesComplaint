export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="border-b-2 border-ink/10 px-6 py-4 flex items-center justify-between bg-paper">
        <a href="/" className="font-display text-xl font-semibold text-ink">
          Civic Complaints
        </a>
        <div className="flex gap-6 items-center font-body text-sm">
          <a href="/submit" className="text-sage hover:text-civic transition-colors">Report an issue</a>
          <a href="/track" className="text-sage hover:text-civic transition-colors">Track a complaint</a>
          <a href="/login" className="text-ink border-2 border-ink/10 px-4 py-1.5 rounded-md hover:border-civic transition-colors">
            Staff login
          </a>
        </div>
      </nav>
      {children}
    </div>
  );
}