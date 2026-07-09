import type { Context } from "hono";

export type FieldError = { field?: string; message: string; code?: string };

export type Pagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

/** The single response envelope every endpoint returns (mirrors avorino-api). */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: FieldError[];
  pagination: Pagination | null;
  metadata: { timestamp: string };
}

function envelope<T>(partial: {
  success: boolean;
  message: string;
  data?: T | null;
  errors?: FieldError[];
  pagination?: Pagination | null;
}): ApiEnvelope<T> {
  return {
    success: partial.success,
    message: partial.message,
    data: partial.data ?? null,
    errors: partial.errors ?? [],
    pagination: partial.pagination ?? null,
    metadata: { timestamp: new Date().toISOString() },
  };
}

// Hono's status typing is stricter than plain numbers; cast at the boundary.
type Status = Parameters<Context["json"]>[1];

export function ok<T>(c: Context, data: T, message = "OK", pagination: Pagination | null = null) {
  return c.json(envelope({ success: true, message, data, pagination }), 200 as Status);
}

export function created<T>(c: Context, data: T, message = "Created") {
  return c.json(envelope({ success: true, message, data }), 201 as Status);
}

export function fail(c: Context, status: number, message: string, errors: FieldError[] = []) {
  return c.json(envelope({ success: false, message, errors }), status as Status);
}
