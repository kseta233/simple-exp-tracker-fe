export default function ChatAddLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--background)] flex flex-col">
      {children}
    </main>
  );
}
