export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" width={52} height={52} className="h-[52px] w-[52px] rounded-xl" />
            <span className="text-3xl font-bold tracking-tight">Fintrix</span>
          </div>
          <p className="text-sm text-muted-foreground">Gestão financeira da família</p>
        </div>
        {children}
      </div>
    </main>
  );
}
