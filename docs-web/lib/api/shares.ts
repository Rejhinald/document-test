import { apiFetch } from "./client";
import type { ShareRecipient, ShareRole } from "./types";

export const listShares = (documentId: string) =>
  apiFetch<{ shares: ShareRecipient[] }>(`/documents/${documentId}/shares`);

export const createShare = (documentId: string, email: string, role: ShareRole) =>
  apiFetch<ShareRecipient>(`/documents/${documentId}/shares`, {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });

export const updateShare = (documentId: string, userId: string, role: ShareRole) =>
  apiFetch<{ userId: string; role: ShareRole }>(`/documents/${documentId}/shares/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });

export const revokeShare = (documentId: string, userId: string) =>
  apiFetch<{ userId: string }>(`/documents/${documentId}/shares/${userId}`, { method: "DELETE" });
