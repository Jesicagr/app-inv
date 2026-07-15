import AppHeader from "../../components/AppHeader";
import Navigation from "../../components/Navigation";
import AuthGuard from "../../components/AuthGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Navigation />
      <div className="min-h-screen md:pl-64">
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <main className="flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-8 md:pt-6">
            <div className="mx-auto max-w-[1440px] space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
