import type { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
