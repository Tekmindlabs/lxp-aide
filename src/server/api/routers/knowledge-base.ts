import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { knowledgeBaseService } from "../../../lib/knowledge-base/knowledge-base-service";
import { DocumentProcessor } from "../../../lib/knowledge-base/document-processor";
import { FolderSchema, WorkspaceSchema } from "../../../lib/knowledge-base/types";

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

	createWorkspace: protectedProcedure
		.input(WorkspaceSchema.omit({ id: true, vectorCollection: true }))
		.mutation(async ({ input }) => {
			return await knowledgeBaseService.createWorkspace(input);
		}),

	createFolder: protectedProcedure
		.input(FolderSchema.omit({ id: true, children: true }))
		.mutation(async ({ input }) => {
			return await knowledgeBaseService.createFolder(input);
		}),

	uploadDocument: protectedProcedure
		.input(z.object({
			file: z.any(),
			workspaceId: z.string(),
			metadata: z.record(z.any()).optional()
		}))
		.mutation(async ({ input }) => {
			const { document } = await DocumentProcessor.processDocumentWithChunks(
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
		}),

	getWorkspace: protectedProcedure
		.input(z.object({
			workspaceId: z.string(),
		}))
		.query(async ({ ctx, input }) => {
			const workspace = await ctx.prisma.workspaceDocument.findMany({
				where: { workspaceId: input.workspaceId },
				include: {
					sourceDocument: true,
				},
			});

			const settings = await ctx.prisma.workspaceSettings.findUnique({
				where: { workspaceId: input.workspaceId },
			});

			const chat = await ctx.prisma.workspaceChat.findFirst({
				where: {
					workspaceId: input.workspaceId,
					userId: ctx.session.user.id,
				},
			});

			return {
				id: input.workspaceId,
				documents: workspace,
				settings: settings || {
					id: '',
					workspaceId: input.workspaceId,
					messageLimit: 100,
					aiProvider: 'openai',
					aiModel: 'gpt-3.5-turbo',
					maxTokens: 2000,
					temperature: 0.7,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				chat,
			};
		}),

	updateWorkspaceSettings: protectedProcedure
		.input(z.object({
			workspaceId: z.string(),
			settings: z.object({
				messageLimit: z.number().min(1).max(1000),
				aiProvider: z.enum(['openai', 'anthropic', 'google']),
				aiModel: z.string().min(1),
				maxTokens: z.number().min(100).max(4000),
				temperature: z.number().min(0).max(2),
			}),
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.workspaceSettings.upsert({
				where: { workspaceId: input.workspaceId },
				create: {
					workspaceId: input.workspaceId,
					...input.settings,
				},
				update: input.settings,
			});
		})
});