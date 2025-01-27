import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { knowledgeBaseService } from "../../../lib/knowledge-base/knowledge-base-service";
import { DocumentProcessor } from "../../../lib/knowledge-base/document-processor";
import { FolderSchema } from "../../../lib/knowledge-base/types";
import { prisma } from "../../db";

export const knowledgeBaseRouter = createTRPCRouter({
	getFolders: protectedProcedure
		.input(z.object({
			knowledgeBaseId: z.string()
		}))
		.query(async ({ ctx, input }) => {
			// Handle default workspace case
			if (input.knowledgeBaseId === 'workspace_default') {
				const defaultWorkspace = await ctx.prisma.workspace.findFirst({
					where: { isDefault: true }
				});
				
				if (!defaultWorkspace) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Default workspace not found'
					});
				}
				
				return await knowledgeBaseService.getFolders(defaultWorkspace.id);
			}
			
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
			
			return await knowledgeBaseService.addDocument({
				...document,
				embeddings: [], // embeddings will be generated in the service
			}, input.knowledgeBaseId);
		}),

		getWorkspace: protectedProcedure
			.input(z.object({
				workspaceId: z.string()
			}))
			.query(async ({ ctx, input }) => {
				// Handle default workspace case
				if (input.workspaceId === 'workspace_default') {
					const defaultWorkspace = await ctx.prisma.workspace.findFirst({
						where: { isDefault: true },
						include: {
							knowledgeBases: true,
							folders: {
								include: {
									documents: true
								}
							}
						}
					});

					if (!defaultWorkspace) {
						throw new TRPCError({
							code: 'NOT_FOUND',
							message: 'Default workspace not found'
						});
					}

					return defaultWorkspace;
				}

				const workspace = await ctx.prisma.workspace.findUnique({
					where: { id: input.workspaceId },
					include: {
						knowledgeBases: true,
						folders: {
							include: {
								documents: true
							}
						}
					}
				});

				if (!workspace) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Workspace not found'
					});
				}

				return workspace;
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
