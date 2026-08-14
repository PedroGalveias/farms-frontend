/** Shared streamed fallback for the data-backed canton/product/region routes. */
export default function RouteDataSkeleton() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="skeleton h-4 w-36 rounded-chip" />
      <div className="skeleton mt-7 h-12 w-2/3 rounded-field" />
      <div className="skeleton mt-4 h-5 w-1/2 rounded-chip" />
      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }, (_, index) => (
          <div className="skeleton h-20 rounded-field" key={index} />
        ))}
      </div>
    </main>
  );
}
