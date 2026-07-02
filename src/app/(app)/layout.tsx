import { BottomNav } from "@/components/bottom-nav";

// Layout da área logada: container mobile + espaço para a bottom-nav fixa.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-[480px]">
      <main className="px-4 pb-28 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
