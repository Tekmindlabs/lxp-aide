import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { knowledgeBaseService } from "../../../lib/knowledge-base/knowledge-base-service";
import { DocumentProcessor } from "../../../lib/knowledge-base/document-processor";
import { FolderSchema } from "../../../lib/knowledge-base/types";

export const knowledgeBaseRouter = createTRPCRouter({
	getFolders: protectedProcedure
		.input(z.object({
			knowledgeBaseId: z.string()
		}))
		.query(async ({ input }) => {
			return await knowledgeBaseService.getFolders(input.knowledgeBaseId);
		}),

	getDocuments: protectedProcedure
		.input(z.object({
			folderId: z.string()
		}))
		.query(async ({ input }) => {
			return await knowledgeBaseService.getDocuments(input.folderId);
		}),

	createFolder: protectedProcedure
		.input(FolderSchema.omit({ id: true, children: true }))
		.mutation(async ({ input }) => {
			return await knowledgeBaseService.createFolder(input);
		}),

	uploadDocument: protectedProcedure
		.input(z.object({
			file: z.any(),
			knowledgeBaseId: z.string(),
			metadata: z.record(z.any()).optional()
		}))
		.mutation(async ({ input }) => {
			const { document } = await DocumentProcessor.processDocumentWithChunks(
				input.file,
				input.metadata
			);
			
			return await knowledgeBaseService.addDocument(document, input.knowledgeBaseId);
		}),

	searchDocuments: protectedProcedure
		.input(z.object({
			knowledgeBaseId: z.string(),
			query: z.string(),
			limit: z.number().optional()
		}))
		.query(async ({ input }) => {
			return await knowledgeBaseService.searchDocuments(
				input.knowledgeBaseId,
				input.query,
				input.limit
			);
		})
});
