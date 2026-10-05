export default function Loading() {
  return (
    <div className="page-stack" role="status" aria-label="Carregando seu espaço financeiro">
      <span className="sr-only">Carregando…</span>
      <div className="skeleton h-4 w-32" />
      <div className="skeleton h-8 w-64 max-w-full" />
      <div className="grid gap-5 md:grid-cols-3">
        <div className="skeleton h-56 md:col-span-2" />
        <div className="skeleton h-56" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
      <div className="skeleton h-64" />
    </div>
  );
}
