// Shown while the home page resolves its farm data (the backend can be slow on a
// cold start). Mirrors the hero → toolbar → card-grid layout with shimmering
// placeholders so the page settles in place instead of flashing blank.
export default function HomeSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-5 pt-6 sm:px-8 lg:pt-0">
      <section className="pt-10 sm:pt-14">
        <div className="grid items-stretch gap-5 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col justify-center gap-5">
            <div className="skeleton h-7 w-64 rounded-chip" />
            <div className="skeleton h-24 w-full max-w-md rounded-card" />
            <div className="skeleton h-5 w-80 max-w-full rounded-chip" />
            <div className="flex flex-wrap gap-3">
              <div className="skeleton h-14 w-48 rounded-chip" />
              <div className="skeleton h-14 w-36 rounded-chip" />
            </div>
          </div>
          <div className="skeleton min-h-[260px] rounded-panel lg:min-h-0" />
        </div>
      </section>

      <div className="mt-16">
        <div className="skeleton h-44 rounded-panel" />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="skeleton h-64 rounded-panel" key={index} />
        ))}
      </div>
    </main>
  );
}
