import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty.").max(200, "Title is too long.").optional(),
  content: z.string().optional(),
});

export const updateDocumentSchema = z
  .object({
    title: z.string().trim().min(1, "Title cannot be empty.").max(200, "Title is too long.").optional(),
    content: z.string().optional(),
  })
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: "Provide a title or content to update.",
  });

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
