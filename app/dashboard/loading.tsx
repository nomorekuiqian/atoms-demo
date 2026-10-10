export default function Loading() {
  return (
    <main className="mx-auto max-w-[880px] px-4 pb-24 pt-[104px] sm:px-6" aria-busy="true">
      <div className="h-11 w-48 animate-pulse rounded-md bg-surface-2" />
      <div className="mt-8 space-y-px overflow-hidden rounded-lg border bg-surface">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse px-4 py-5"><div className="h-4 w-1/3 rounded bg-surface-2" /></div>
        ))}
      </div>
    </main>
  );
}
