import { z } from "zod";

export const createShareSchema = z.object({
  email: z.email("A valid email is required."),
  role: z.enum(["viewer", "editor"]).default("viewer"),
});

export const updateShareSchema = z.object({
  role: z.enum(["viewer", "editor"]),
});

export type CreateShareInput = z.infer<typeof createShareSchema>;
export type UpdateShareInput = z.infer<typeof updateShareSchema>;
