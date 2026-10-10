export default function Loading() {
  return (
    <div className="flex h-dvh flex-col bg-bg" aria-busy="true">
      <div className="h-14" />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 px-2 pb-2 md:grid-cols-[minmax(360px,38%)_1fr]">
        <div className="space-y-4 p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-md bg-surface-2" />
          ))}
        </div>
        <div className="hidden animate-pulse rounded-lg border bg-surface md:block" />
      </div>
    </div>
  );
}
