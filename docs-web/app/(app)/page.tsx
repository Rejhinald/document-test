"use client";

import { useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listDocuments } from "@/lib/api/documents";
import { getMe } from "@/lib/api/auth";
import { useDocumentActions } from "@/hooks/use-document-actions";
import { Spinner } from "@/components/ui/spinner";
import { RoleBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { FileText, Plus, Upload } from "lucide-react";

const ACCEPTED_TYPES = ".txt,.md,.markdown,.docx";

type RecentDoc = {
  id: string;
  title: string;
  updatedAt: string;
  subtitle: string;
  role: "owner" | "editor" | "viewer";
};

export default function HomePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { busy, error, createNew, importFile } = useDocumentActions();

  const { data: user } = useQuery({ queryKey: ["me"], queryFn: getMe });
  const { data, isLoading } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });

  const recent: RecentDoc[] = [
    ...(data?.owned ?? []).map((d) => ({
      id: d.id,
      title: d.title,
      updatedAt: d.updatedAt,
      subtitle: `Edited ${formatDate(d.updatedAt)}`,
      role: "owner" as const,
    })),
    ...(data?.shared ?? []).map((d) => ({
      id: d.id,
      title: d.title,
      updatedAt: d.updatedAt,
      subtitle: `${d.owner.name} · Edited ${formatDate(d.updatedAt)}`,
      role: d.role,
    })),
  ]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 6);

  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Welcome back, {firstName}</h1>
        <p className="text-ink-soft mt-1 text-sm">
          Create a document, import a file, or pick up where you left off.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={createNew}
          disabled={busy !== null}
          className="border-line bg-surface hover:border-accent/50 group flex items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:opacity-60"
        >
          <span className="bg-accent-soft text-accent flex size-10 shrink-0 items-center justify-center rounded-lg">
            {busy === "create" ? <Spinner /> : <Plus className="size-5" />}
          </span>
          <span>
            <span className="block font-medium">New document</span>
            <span className="text-ink-soft block text-sm">Start with a blank page.</span>
          </span>
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy !== null}
          className="border-line bg-surface hover:border-accent/50 group flex items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:opacity-60"
        >
          <span className="bg-accent-soft text-accent flex size-10 shrink-0 items-center justify-center rounded-lg">
            {busy === "import" ? <Spinner /> : <Upload className="size-5" />}
          </span>
          <span>
            <span className="block font-medium">Import a file</span>
            <span className="text-ink-soft block text-sm">.txt, .md, or .docx (max 5&nbsp;MB).</span>
          </span>
        </button>
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
      </div>

      {error && (
        <p className="border-danger/30 bg-danger/5 text-danger rounded-md border px-3 py-2 text-sm">{error}</p>
      )}

      <section>
        <h2 className="text-ink-soft mb-3 text-xs font-semibold tracking-wide uppercase">Recent</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-line bg-surface h-14 animate-pulse rounded-lg border" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="border-line text-ink-soft rounded-lg border border-dashed px-4 py-8 text-center text-sm">
            No documents yet — create one to get started.
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/documents/${doc.id}`}
                  className="border-line bg-surface hover:border-accent/40 flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors"
                >
                  <FileText className="text-ink-soft size-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{doc.title}</span>
                    <span className="text-ink-soft block text-xs">{doc.subtitle}</span>
                  </span>
                  {doc.role !== "owner" && <RoleBadge role={doc.role} />}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
