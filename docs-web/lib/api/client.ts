import type { FieldError } from "./types";

const API_BASE = "/api/v1";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T | null;
  errors: FieldError[];
  pagination: unknown;
  metadata: { timestamp: string };
};

export class ApiError extends Error {
  status: number;
  errors: FieldError[];

  constructor(message: string, status: number, errors: FieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Calls the API through the same-origin /api proxy. Sends cookies, parses the
 * envelope, and throws ApiError on any non-success response.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  // JSON bodies are strings; FormData sets its own multipart Content-Type.
  if (typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: "include" });

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }

  if (!res.ok || !body || !body.success) {
    throw new ApiError(
      body?.message ?? `Request failed (${res.status})`,
      res.status,
      body?.errors ?? [],
    );
  }

  return body.data as T;
}
