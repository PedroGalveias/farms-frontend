// Shown while quick search resolves its farm data.
export default function QuickSearchLoading() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="skeleton h-6 w-40 rounded-chip" />
      <div className="skeleton mt-5 h-20 w-full max-w-lg rounded-card" />
      <div className="skeleton mt-8 h-[420px] rounded-panel" />
    </main>
  );
}
