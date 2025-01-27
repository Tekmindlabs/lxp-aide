import { z } from "zod";

export const KnowledgeBaseSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	vectorCollection: z.string(),
	createdAt: z.date(),
	updatedAt: z.date()
});

// Fix recursive folder type
type FolderSchemaType = z.ZodObject<{
	id: z.ZodString;
	name: z.ZodString;
	description: z.ZodString;
	parentFolderId: z.ZodOptional<z.ZodString>;
	knowledgeBaseId: z.ZodString;
	metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
	children: z.ZodArray<z.ZodLazy<z.ZodType<any>>>;
}>;

export const FolderSchema: FolderSchemaType = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	parentFolderId: z.string().optional(),
	knowledgeBaseId: z.string(),
	metadata: z.record(z.string(), z.any()).optional(),
	children: z.array(z.lazy(() => FolderSchema))
});

export const DocumentSchema = z.object({
	id: z.string(),
	title: z.string(),
	type: z.string(),
	content: z.string(),
	metadata: z.record(z.string(), z.any()).optional(),
	embeddings: z.array(z.number()),
	folderId: z.string(),
	knowledgeBaseId: z.string(),
	createdAt: z.date(),
	updatedAt: z.date()
});

export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;
export type Folder = z.infer<typeof FolderSchema>;
export type Document = z.infer<typeof DocumentSchema>;