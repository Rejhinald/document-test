import type { ZodError } from "zod";
import type { FieldError } from "./response";

/** Flatten a ZodError into the envelope's field-level error shape. */
export function formatZodError(err: ZodError): FieldError[] {
  return err.issues.map((issue) => ({
    field: issue.path.length ? issue.path.join(".") : undefined,
    message: issue.message,
    code: issue.code,
  }));
}
