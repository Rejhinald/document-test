"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listShares, createShare, updateShare, revokeShare } from "@/lib/api/shares";
import { ApiError } from "@/lib/api/client";
import type { ShareRole } from "@/lib/api/types";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Trash2 } from "lucide-react";

const ROLE_SELECT = "border-line bg-surface h-9 rounded-md border px-2 text-sm";

export function ShareDialog({
  documentId,
  open,
  onClose,
}: {
  documentId: string;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("viewer");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["shares", documentId] });

  const sharesQuery = useQuery({
    queryKey: ["shares", documentId],
    queryFn: () => listShares(documentId),
    enabled: open,
  });

  const add = useMutation({
    mutationFn: () => createShare(documentId, email.trim(), role),
    onSuccess: () => {
      setEmail("");
      invalidate();
    },
  });

  const changeRole = useMutation({
    mutationFn: (input: { userId: string; role: ShareRole }) =>
      updateShare(documentId, input.userId, input.role),
    onSuccess: invalidate,
  });

  const revoke = useMutation({
    mutationFn: (userId: string) => revokeShare(documentId, userId),
    onSuccess: invalidate,
  });

  const addError = add.error instanceof ApiError ? add.error.message : null;
  const shares = sharesQuery.data?.shares ?? [];

  return (
    <Dialog open={open} onClose={onClose} title="Share document">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) add.mutate();
        }}
        className="space-y-2"
      >
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
          />
          <select value={role} onChange={(e) => setRole(e.target.value as ShareRole)} className={ROLE_SELECT}>
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <Button type="submit" disabled={add.isPending || !email.trim()}>
            {add.isPending ? <Spinner className="text-white" /> : "Share"}
          </Button>
        </div>
        {addError && <p className="text-danger text-sm">{addError}</p>}
      </form>

      <div className="mt-5">
        <p className="text-ink-soft mb-2 text-xs font-semibold tracking-wide uppercase">People with access</p>
        {sharesQuery.isLoading ? (
          <div className="py-3">
            <Spinner />
          </div>
        ) : shares.length === 0 ? (
          <p className="text-ink-soft text-sm">Not shared with anyone yet.</p>
        ) : (
          <ul className="space-y-2">
            {shares.map((share) => (
              <li
                key={share.userId}
                className="border-line flex items-center justify-between gap-2 rounded-md border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{share.name}</p>
                  <p className="text-ink-soft truncate text-xs">{share.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={share.role}
                    onChange={(e) =>
                      changeRole.mutate({ userId: share.userId, role: e.target.value as ShareRole })
                    }
                    className="border-line bg-surface h-8 rounded-md border px-2 text-xs"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${share.email}`}
                    onClick={() => revoke.mutate(share.userId)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
