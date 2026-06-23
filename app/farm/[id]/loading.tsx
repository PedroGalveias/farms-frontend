// Shown while the farm page resolves its data (the farms list can be slow on a
// cold backend). Mirrors the real layout so the page doesn't jump on load.
// Uses the shared `.skeleton` primitive, which only fades in if the load drags.
export default function FarmLoading() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="skeleton h-4 w-32 rounded-full" />

      <div className="mt-6 space-y-3">
        <div className="skeleton h-3 w-24 rounded-full" />
        <div className="skeleton h-12 w-3/4 rounded-2xl" />
        <div className="skeleton h-4 w-2/3 rounded-full" />
      </div>

      <div className="mt-7 flex gap-3">
        <div className="skeleton h-12 w-44 rounded-full" />
        <div className="skeleton h-12 w-28 rounded-full" />
      </div>

      <div className="mt-7 space-y-3">
        <div className="skeleton h-16 rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="skeleton h-16 rounded-2xl" />
          <div className="skeleton h-16 rounded-2xl" />
        </div>
        <div className="skeleton h-24 rounded-2xl" />
      </div>

      <div className="skeleton mt-7 h-[360px] rounded-[24px]" />
    </main>
  );
}
