// Shown while the farm page resolves its data (the farms list can be slow on a
// cold backend). Mirrors the real layout so the page doesn't jump on load.
export default function FarmLoading() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="h-4 w-32 animate-pulse rounded-full bg-tone" />

      <div className="mt-6 space-y-3">
        <div className="h-3 w-24 animate-pulse rounded-full bg-tone" />
        <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-tone" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-tone" />
      </div>

      <div className="mt-7 flex gap-3">
        <div className="h-12 w-44 animate-pulse rounded-full bg-tone" />
        <div className="h-12 w-28 animate-pulse rounded-full bg-tone" />
      </div>

      <div className="mt-7 space-y-3">
        <div className="h-16 animate-pulse rounded-2xl bg-tone" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-16 animate-pulse rounded-2xl bg-tone" />
          <div className="h-16 animate-pulse rounded-2xl bg-tone" />
        </div>
        <div className="h-24 animate-pulse rounded-2xl bg-tone" />
      </div>

      <div className="mt-7 h-[360px] animate-pulse rounded-[24px] bg-tone" />
    </main>
  );
}
