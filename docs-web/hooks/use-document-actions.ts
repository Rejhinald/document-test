"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createDocument, importDocument } from "@/lib/api/documents";
import { ApiError } from "@/lib/api/client";

/**
 * Shared "create" / "import" actions used by both the sidebar and the home screen.
 * On success it invalidates the document list and navigates to the new document.
 */
export function useDocumentActions(onNavigate?: () => void) {
  const qc = useQueryClient();
  const router = useRouter();
  const [busy, setBusy] = useState<null | "create" | "import">(null);
  const [error, setError] = useState<string | null>(null);

  const openDocument = (id: string) => {
    qc.invalidateQueries({ queryKey: ["documents"] });
    onNavigate?.();
    router.push(`/documents/${id}`);
  };

  const createNew = async () => {
    setBusy("create");
    setError(null);
    try {
      const doc = await createDocument({});
      openDocument(doc.id);
    } catch {
      setError("Could not create a document.");
      setBusy(null);
    }
  };

  const importFile = async (file: File) => {
    setBusy("import");
    setError(null);
    try {
      const doc = await importDocument(file);
      openDocument(doc.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not import that file.");
      setBusy(null);
    }
  };

  return { busy, error, createNew, importFile };
}
