export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-2xl font-bold text-primary-foreground">
            F
          </div>
          <h1 className="text-2xl font-bold">Fintrix</h1>
          <p className="text-sm text-muted-foreground">Gestão financeira do casal</p>
        </div>
        {children}
      </div>
    </main>
  );
}
