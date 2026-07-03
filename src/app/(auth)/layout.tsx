export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Fintrix"
            width={64}
            height={64}
            className="mx-auto mb-3 h-16 w-16 rounded-2xl"
          />
          <h1 className="text-2xl font-bold">Fintrix</h1>
          <p className="text-sm text-muted-foreground">Gestão financeira do casal</p>
        </div>
        {children}
      </div>
    </main>
  );
}
