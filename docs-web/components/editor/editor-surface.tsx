"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ArrowLeft, Check, Cloud, Share2, Trash2 } from "lucide-react";
import { updateDocument, deleteDocument } from "@/lib/api/documents";
import type { DocumentDetail } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ShareDialog } from "@/components/share-dialog";
import { Toolbar } from "./toolbar";

type SaveState = "idle" | "saving" | "saved";
const AUTOSAVE_MS = 700;

export function EditorSurface({ doc }: { doc: DocumentDetail }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [title, setTitle] = useState(doc.title);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [shareOpen, setShareOpen] = useState(false);

  const contentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveNowRef = useRef<() => void>(() => {});

  const persist = async (patch: { title?: string; content?: string }) => {
    setSaveState("saving");
    try {
      await updateDocument(doc.id, patch);
      setSaveState("saved");
      qc.invalidateQueries({ queryKey: ["documents"] });
    } catch {
      setSaveState("idle");
    }
  };

  const editor = useEditor({
    editable: doc.canEdit,
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } })],
    content: doc.content,
    editorProps: {
      attributes: { class: "tiptap min-h-[55vh] focus:outline-none" },
    },
    onUpdate: ({ editor }) => {
      if (!doc.canEdit) return;
      setSaveState("saving");
      if (contentTimer.current) clearTimeout(contentTimer.current);
      const html = editor.getHTML();
      contentTimer.current = setTimeout(() => persist({ content: html }), AUTOSAVE_MS);
    },
  });

  const onTitleChange = (value: string) => {
    setTitle(value);
    if (!doc.canEdit) return;
    setSaveState("saving");
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(
      () => persist({ title: value.trim() || "Untitled document" }),
      AUTOSAVE_MS,
    );
  };

  const saveNow = () => {
    if (!doc.canEdit || !editor) return;
    if (contentTimer.current) clearTimeout(contentTimer.current);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    void persist({ title: title.trim() || "Untitled document", content: editor.getHTML() });
  };

  // Keep a stable Cmd/Ctrl+S handler that always calls the latest saveNow.
  useEffect(() => {
    saveNowRef.current = saveNow;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveNowRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Flush timers on unmount.
  useEffect(
    () => () => {
      if (contentTimer.current) clearTimeout(contentTimer.current);
      if (titleTimer.current) clearTimeout(titleTimer.current);
    },
    [],
  );

  const isOwner = doc.role === "owner";

  const onDelete = async () => {
    if (!isOwner) return;
    if (!confirm(`Delete “${title || "this document"}”? This can't be undone.`)) return;
    try {
      await deleteDocument(doc.id);
      qc.invalidateQueries({ queryKey: ["documents"] });
      router.push("/");
    } catch {
      /* stay on the page if delete fails */
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="text-ink-soft hover:text-ink inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="size-4" /> All documents
        </Link>
        <div className="flex items-center gap-3">
          <SaveIndicator state={saveState} canEdit={doc.canEdit} />
          {!doc.canEdit && <RoleBadge role={doc.role} />}
          {isOwner && (
            <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
              <Share2 className="size-4" /> Share
            </Button>
          )}
          {doc.canEdit && (
            <Button size="sm" onClick={saveNow} disabled={saveState === "saving"}>
              Save
            </Button>
          )}
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete document"
              onClick={onDelete}
              className="text-danger hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="border-line bg-surface overflow-hidden rounded-xl border shadow-sm">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          readOnly={!doc.canEdit}
          placeholder="Untitled document"
          aria-label="Document title"
          className="text-ink placeholder:text-ink-soft/50 w-full border-none bg-transparent px-6 pt-6 pb-2 font-serif text-3xl font-semibold focus:outline-none"
        />
        {doc.canEdit && editor && <Toolbar editor={editor} />}
        <div className="px-6 py-5">
          <EditorContent editor={editor} className="doc-content" />
        </div>
      </div>

      {!doc.canEdit && (
        <p className="text-ink-soft text-center text-xs">
          You have {doc.role} access to this document.
        </p>
      )}

      {isOwner && <ShareDialog documentId={doc.id} open={shareOpen} onClose={() => setShareOpen(false)} />}
    </div>
  );
}

function SaveIndicator({ state, canEdit }: { state: SaveState; canEdit: boolean }) {
  if (!canEdit) return null;
  if (state === "saving") {
    return (
      <span className="text-ink-soft inline-flex items-center gap-1.5 text-xs">
        <Spinner className="size-3.5" /> Saving…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="text-ink-soft inline-flex items-center gap-1.5 text-xs">
        <Check className="text-accent size-3.5" /> Saved
      </span>
    );
  }
  return (
    <span className="text-ink-soft inline-flex items-center gap-1.5 text-xs">
      <Cloud className="size-3.5" /> Autosave on
    </span>
  );
}
