import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { knowledgeBaseService } from "../../../lib/knowledge-base/knowledge-base-service";
import { DocumentProcessor } from "../../../lib/knowledge-base/document-processor";
import { FolderSchema } from "../../../lib/knowledge-base/types";

export const knowledgeBaseRouter = createTRPCRouter({
    getFolders: protectedProcedure
        .input(z.object({
            knowledgeBaseId: z.string()
        }))
        .query(async ({ ctx, input }) => {
            // Handle default workspace case
            if (input.knowledgeBaseId === 'workspace_default') {
                const defaultWorkspace = await ctx.prisma.workspace.findFirst({
                    where: { isDefault: true },
                    include: { knowledgeBase: true }
                });
                
                if (!defaultWorkspace) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Default workspace not found'
                    });
                }
                
                return await knowledgeBaseService.getFolders(defaultWorkspace.knowledgeBase.id);
            }
            
            return await knowledgeBaseService.getFolders(input.knowledgeBaseId);
        }),

    getDocument: protectedProcedure
        .input(z.object({
            folderId: z.string()
        }))
        .query(async ({ input }) => {
            return await knowledgeBaseService.getDocument(input.folderId);
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
            
            // Create a new object with only the fields we want to pass
            const documentToSave = {
                type: document.type,
                knowledgeBaseId: document.knowledgeBaseId,
                folderId: document.folderId,
                title: document.title,
                content: document.content,
                metadata: document.metadata
            };
            
            return await knowledgeBaseService.addDocument(
                documentToSave,
                input.knowledgeBaseId
            );
        }),

    getWorkspace: protectedProcedure
        .input(z.object({
            workspaceId: z.string()
        }))
        .query(async ({ ctx, input }) => {
            const workspaceQuery = {
                include: {
                    knowledgeBase: true,
                    documents: {
                        include: {
                            sourceDocument: true
                        }
                    },
                    settings: true
                }
            };

            const workspace = input.workspaceId === 'workspace_default'
                ? await ctx.prisma.workspace.findFirst({
                    ...workspaceQuery,
                    where: { isDefault: true }
                })
                : await ctx.prisma.workspace.findUnique({
                    ...workspaceQuery,
                    where: { id: input.workspaceId }
                });

            if (!workspace) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `${input.workspaceId === 'workspace_default' ? 'Default workspace' : 'Workspace'} not found`
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