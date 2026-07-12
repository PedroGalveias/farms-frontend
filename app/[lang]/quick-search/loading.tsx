// Shown while quick search resolves its farm data.
export default function QuickSearchLoading() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="skeleton h-6 w-40 rounded-full" />
      <div className="skeleton mt-5 h-20 w-full max-w-lg rounded-3xl" />
      <div className="skeleton mt-8 h-[420px] rounded-[32px]" />
    </main>
  );
}
