import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { knowledgeBaseService } from "../../../lib/knowledge-base/knowledge-base-service";
import { DocumentProcessor } from "../../../lib/knowledge-base/document-processor";
import { DocumentSchema, FolderSchema, WorkspaceSchema } from "../../../lib/knowledge-base/types";

export const knowledgeBaseRouter = createTRPCRouter({
	createWorkspace: protectedProcedure
		.input(WorkspaceSchema.omit({ id: true, vectorCollection: true }))
		.mutation(async ({ input }) => {
			return await knowledgeBaseService.createWorkspace(input);
		}),

	createFolder: protectedProcedure
		.input(FolderSchema.omit({ id: true }))
		.mutation(async ({ input }) => {
			return await knowledgeBaseService.createFolder(input);
		}),

	uploadDocument: protectedProcedure
		.input(z.object({
			file: z.any(), // File will be handled by client
			workspaceId: z.string(),
			metadata: z.record(z.any()).optional()
		}))
		.mutation(async ({ input }) => {
			const { document, chunks } = await DocumentProcessor.processDocumentWithChunks(
				input.file,
				input.metadata
			);
			
			return await knowledgeBaseService.addDocument(document, input.workspaceId);
		}),

	searchDocuments: protectedProcedure
		.input(z.object({
			workspaceId: z.string(),
			query: z.string(),
			limit: z.number().optional()
		}))
		.query(async ({ input }) => {
			return await knowledgeBaseService.searchDocuments(
				input.workspaceId,
				input.query,
				input.limit
			);
		}),

	deleteWorkspace: protectedProcedure
		.input(z.object({ workspaceId: z.string() }))
		.mutation(async ({ input }) => {
			await knowledgeBaseService.deleteWorkspace(input.workspaceId);
		})
});