import { apiFetch } from "./client";
import type { DocumentDetail, DocumentsList } from "./types";

export const listDocuments = () => apiFetch<DocumentsList>("/documents");

export const getDocument = (id: string) => apiFetch<DocumentDetail>(`/documents/${id}`);

export const createDocument = (input: { title?: string; content?: string } = {}) =>
  apiFetch<DocumentDetail>("/documents", { method: "POST", body: JSON.stringify(input) });

export const updateDocument = (id: string, patch: { title?: string; content?: string }) =>
  apiFetch<DocumentDetail>(`/documents/${id}`, { method: "PATCH", body: JSON.stringify(patch) });

export const deleteDocument = (id: string) =>
  apiFetch<{ id: string }>(`/documents/${id}`, { method: "DELETE" });

export const importDocument = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<DocumentDetail>("/documents/import", { method: "POST", body: form });
};
