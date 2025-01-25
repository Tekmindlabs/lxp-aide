import { z } from "zod";

export const KnowledgeBaseSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	vectorCollection: z.string(),
	createdAt: z.date(),
	updatedAt: z.date()
});

export const FolderSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	parentFolderId: z.string().optional(),
	knowledgeBaseId: z.string(),
	children: z.array(z.lazy(() => FolderSchema)),
	metadata: z.record(z.any())
});

export const DocumentSchema = z.object({
	id: z.string(),
	title: z.string(),
	type: z.string(),
	content: z.string(),
	metadata: z.record(z.any()),
	embeddings: z.array(z.array(z.number())),
	folderId: z.string(),
	createdAt: z.date(),
	updatedAt: z.date()
});

export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;
export type Folder = z.infer<typeof FolderSchema>;
export type Document = z.infer<typeof DocumentSchema>;