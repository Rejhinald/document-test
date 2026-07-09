"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, logout } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { Menu } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  useEffect(() => {
    if (isError && (!(error instanceof ApiError) || error.status === 401)) {
      router.replace("/login");
    }
  }, [isError, error, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  const onLogout = async () => {
    try {
      await logout();
    } finally {
      qc.clear();
      router.replace("/login");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="border-line bg-surface sticky top-0 hidden h-screen w-64 shrink-0 border-r md:flex md:flex-col">
        <AppSidebar user={user} onLogout={onLogout} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="bg-ink/30 absolute inset-0 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="border-line bg-surface absolute inset-y-0 left-0 flex w-64 flex-col border-r shadow-xl">
            <AppSidebar user={user} onLogout={onLogout} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-line bg-surface flex h-14 items-center gap-2 border-b px-4 md:hidden">
          <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <span className="font-serif text-lg font-semibold">Ajaia Docs</span>
        </div>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
