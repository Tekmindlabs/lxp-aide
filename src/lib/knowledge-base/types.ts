import { z } from "zod";

export const DocumentSchema = z.object({
	id: z.string(),
	title: z.string(),
	type: z.string(),
	content: z.string(),
	metadata: z.record(z.any()),
	folderId: z.string(),
	createdAt: z.date(),
	updatedAt: z.date()
});

export const FolderSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	parentFolderId: z.string().optional(),
	metadata: z.record(z.any()),
	children: z.array(z.lazy(() => FolderSchema)).optional()
});

export const WorkspaceSchema = z.object({
	id: z.string(),
	type: z.enum(['CLASS', 'ADMIN']),
	name: z.string(),
	description: z.string(),
	classId: z.string().optional(),
	vectorCollection: z.string()
});

export type Document = z.infer<typeof DocumentSchema>;
export type Folder = z.infer<typeof FolderSchema>;
export type Workspace = z.infer<typeof WorkspaceSchema>;