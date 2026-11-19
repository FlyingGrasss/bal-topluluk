export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12"
      id="icerik"
    >
      <span className="sr-only">Yükleniyor</span>
      <div aria-hidden="true" className="animate-pulse space-y-3">
        <div className="h-3 w-24 rounded bg-[color:var(--elevated)]" />
        <div className="h-9 w-64 max-w-full rounded bg-[color:var(--elevated)]" />
        <div className="h-4 w-full max-w-xl rounded bg-[color:var(--elevated)]" />
        <div className="mt-6 flex gap-2">
          <div className="h-9 w-20 rounded-full bg-[color:var(--elevated)]" />
          <div className="h-9 w-20 rounded-full bg-[color:var(--elevated)]" />
          <div className="h-9 w-20 rounded-full bg-[color:var(--elevated)]" />
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <div className="h-36 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]" />
          <div className="h-36 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]" />
          <div className="h-36 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]" />
          <div className="h-36 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]" />
        </div>
      </div>
    </main>
  );
}
