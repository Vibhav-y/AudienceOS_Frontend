import { Sidebar } from "@/components/sidebar";

// App shell: every product page gets the sidebar; the landing page at /
// lives outside this group and renders without it.
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1280px] px-6 py-8 md:px-10">{children}</div>
      </main>
    </div>
  );
}
