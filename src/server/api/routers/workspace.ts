import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { WorkspaceSchema } from "../../../lib/workspace/types";
import { workspaceService } from "../../../lib/workspace/workspace-service";
import { WorkspaceChatService } from '../../../lib/workspace/workspace-chat-service';
import { createWorkspaceTools } from '../../../lib/ai/workspace-tools';
import { ModelProvider } from '../../../lib/ai/model-providers';
import { prisma } from "../../db";

export const workspaceRouter = createTRPCRouter({
	getWorkspace: protectedProcedure
		.input(z.object({
			workspaceId: z.string(),
		}))
		.query(async ({ ctx, input }) => {
			const user = await ctx.prisma.user.findFirst({
				where: {
					id: ctx.session.user.id,
					deleted: null,
					status: 'ACTIVE'
				}
			});

			if (!user) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User not found or inactive",
				});
			}

			const workspace = await ctx.prisma.workspace.findUnique({
				where: { id: input.workspaceId },
				include: {
					settings: true,
					documents: true,
					knowledgeBase: true
				}
			});

			if (!workspace) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Workspace not found",
				});
			}

			return workspace;
		}),


	createWorkspace: protectedProcedure
		.input(WorkspaceSchema.omit({ id: true }))
		.mutation(async ({ input }) => {
			return await workspaceService.createWorkspace(input);
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
		}),

	deleteWorkspace: protectedProcedure
		.input(z.object({ workspaceId: z.string() }))
		.mutation(async ({ input }) => {
			await workspaceService.deleteWorkspace(input.workspaceId);
		})
});