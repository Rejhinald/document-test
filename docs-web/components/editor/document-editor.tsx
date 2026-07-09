"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getDocument } from "@/lib/api/documents";
import { ApiError } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EditorSurface } from "./editor-surface";

export function DocumentEditor({ documentId }: { documentId: string }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => getDocument(documentId),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (isError || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-serif text-xl font-semibold">
          {notFound ? "Document not available" : "Something went wrong"}
        </h1>
        <p className="text-ink-soft mt-2 text-sm">
          {notFound
            ? "This document doesn't exist or hasn't been shared with you."
            : "We couldn't load this document. Please try again."}
        </p>
        <Link href="/" className={`${buttonVariants({ variant: "outline" })} mt-6`}>
          <ArrowLeft className="size-4" /> Back to documents
        </Link>
      </div>
    );
  }

  // Remount when the document id changes so the editor re-initializes with fresh content.
  return <EditorSurface key={data.id} doc={data} />;
}
