"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { listDocuments } from "@/lib/api/documents";
import type { SessionUser } from "@/lib/api/types";
import { useDocumentActions } from "@/hooks/use-document-actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { RoleBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileText, Plus, Upload, LogOut, FileStack, Users } from "lucide-react";

const ACCEPTED_TYPES = ".txt,.md,.markdown,.docx";

export function AppSidebar({
  user,
  onLogout,
  onNavigate,
}: {
  user: SessionUser;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const fileRef = useRef<HTMLInputElement>(null);
  const { busy, createNew, importFile } = useDocumentActions(onNavigate);

  const { data, isLoading } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const owned = data?.owned ?? [];
  const shared = data?.shared ?? [];

  const activeId = pathname.startsWith("/documents/") ? pathname.split("/")[2] : null;

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link href="/" onClick={onNavigate} className="flex h-14 items-center gap-2 px-4">
        <div className="bg-accent flex size-7 items-center justify-center rounded-md text-white">
          <FileText className="size-4" />
        </div>
        <span className="font-serif text-lg font-semibold">Ajaia Docs</span>
      </Link>

      {/* Primary actions */}
      <div className="space-y-2 px-3">
        <Button className="w-full justify-start" onClick={createNew} disabled={busy !== null}>
          {busy === "create" ? <Spinner className="text-white" /> : <Plus className="size-4" />} New document
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importFile(file);
            e.target.value = "";
          }}
        />
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => fileRef.current?.click()}
          disabled={busy !== null}
        >
          {busy === "import" ? <Spinner /> : <Upload className="size-4" />} Import file
        </Button>
      </div>

      {/* Navigation */}
      <nav className="mt-5 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        <NavGroup icon={<FileStack className="size-3.5" />} label="My Documents" count={owned.length}>
          {isLoading ? (
            <NavLoading />
          ) : owned.length === 0 ? (
            <NavEmpty text="No documents yet" />
          ) : (
            owned.map((doc) => (
              <NavItem
                key={doc.id}
                href={`/documents/${doc.id}`}
                title={doc.title}
                active={activeId === doc.id}
                onNavigate={onNavigate}
              />
            ))
          )}
        </NavGroup>

        <NavGroup icon={<Users className="size-3.5" />} label="Shared with me" count={shared.length}>
          {isLoading ? (
            <NavLoading />
          ) : shared.length === 0 ? (
            <NavEmpty text="Nothing shared yet" />
          ) : (
            shared.map((doc) => (
              <NavItem
                key={doc.id}
                href={`/documents/${doc.id}`}
                title={doc.title}
                active={activeId === doc.id}
                onNavigate={onNavigate}
                badge={<RoleBadge role={doc.role} />}
              />
            ))
          )}
        </NavGroup>
      </nav>

      {/* User footer */}
      <div className="border-line mt-auto border-t p-3">
        <div className="flex items-center gap-2">
          <div className="bg-accent-soft text-accent flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-ink-soft truncate text-xs">{user.email}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Sign out" onClick={onLogout}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function NavGroup({
  icon,
  label,
  count,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-ink-soft mb-1 flex items-center gap-1.5 px-2 text-xs font-semibold tracking-wide uppercase">
        {icon}
        <span>{label}</span>
        <span className="bg-paper ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium">{count}</span>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({
  href,
  title,
  active,
  badge,
  onNavigate,
}: {
  href: string;
  title: string;
  active: boolean;
  badge?: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-accent-soft text-accent font-medium"
          : "text-ink-soft hover:bg-paper hover:text-ink",
      )}
    >
      <FileText className="size-4 shrink-0 opacity-70" />
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {badge}
    </Link>
  );
}

function NavLoading() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <Spinner className="size-3.5" />
    </div>
  );
}

function NavEmpty({ text }: { text: string }) {
  return <p className="text-ink-soft/70 px-2 py-1 text-xs">{text}</p>;
}
