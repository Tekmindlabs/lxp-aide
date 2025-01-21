import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { AttachmentType, ConversationType } from "@prisma/client";

export const messageRouter = createTRPCRouter({
	createConversation: protectedProcedure
		.input(
			z.object({
				title: z.string().optional(),
				type: z.enum(["DIRECT", "GROUP", "CHANNEL"]),
				participantIds: z.array(z.string()),
				initialMessage: z.string(),
				attachments: z.array(
					z.object({
						type: z.enum(["IMAGE", "DOCUMENT", "VIDEO", "AUDIO"]),
						url: z.string(),
					})
				).optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const conversation = await ctx.prisma.conversation.create({
				data: {
					title: input.title,
					type: input.type,
					participants: {
						create: [
							{
								userId: ctx.session.user.id,
								role: "OWNER",
							},
							...input.participantIds.map((id) => ({
								userId: id,
								role: "MEMBER",
							})),
						],
					},
					messages: {
						create: {
							content: input.initialMessage,
							senderId: ctx.session.user.id,
							attachments: input.attachments
								? {
										create: input.attachments,
									}
								: undefined,
						},
					},
				},
				include: {
					participants: {
						include: {
							user: true,
						},
					},
					messages: {
						include: {
							sender: true,
							attachments: true,
						},
					},
				},
			});

			return conversation;
		}),

	sendMessage: protectedProcedure
		.input(
			z.object({
				conversationId: z.string(),
				content: z.string(),
				attachments: z.array(
					z.object({
						type: z.enum(["IMAGE", "DOCUMENT", "VIDEO", "AUDIO"]),
						url: z.string(),
					})
				).optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user is participant
			const participant = await ctx.prisma.conversationParticipant.findFirst({
				where: {
					conversationId: input.conversationId,
					userId: ctx.session.user.id,
					leftAt: null,
				},
			});

			if (!participant) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a participant in this conversation",
				});
			}

			const message = await ctx.prisma.message.create({
				data: {
					content: input.content,
					senderId: ctx.session.user.id,
					conversationId: input.conversationId,
					attachments: input.attachments
						? {
								create: input.attachments,
							}
						: undefined,
				},
				include: {
					sender: true,
					attachments: true,
					reactions: {
						include: {
							user: true,
						},
					},
				},
			});

			return message;
		}),

	getConversations: protectedProcedure.query(async ({ ctx }) => {
		return ctx.prisma.conversation.findMany({
			where: {
				participants: {
					some: {
						userId: ctx.session.user.id,
						leftAt: null,
					},
				},
			},
			include: {
				participants: {
					include: {
						user: true,
					},
				},
				messages: {
					take: 1,
					orderBy: {
						createdAt: "desc",
					},
					include: {
						sender: true,
					},
				},
			},
			orderBy: {
				updatedAt: "desc",
			},
		});
	}),

	getConversation: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			const conversation = await ctx.prisma.conversation.findUnique({
				where: { id: input },
				include: {
					participants: {
						include: {
							user: true,
						},
					},
					messages: {
						include: {
							sender: true,
							attachments: true,
						},
						orderBy: {
							createdAt: "desc",
						},
					},
				},
			});

			if (!conversation) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Conversation not found",
				});
			}

			// Check if user is participant
			const isParticipant = conversation.participants.some(
				(p) => p.userId === ctx.session.user.id && !p.leftAt
			);

			if (!isParticipant) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a participant in this conversation",
				});
			}

			return conversation;
		}),

	markAsRead: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			await ctx.prisma.messageRecipient.updateMany({
				where: {
					message: {
						conversationId: input,
					},
					recipientId: ctx.session.user.id,
					read: false,
				},
				data: {
					read: true,
					readAt: new Date(),
				},
			});
		}),

	searchMessages: protectedProcedure
		.input(
			z.object({
				query: z.string(),
				conversationId: z.string().optional(),
			})
		)
		.query(async ({ ctx, input }) => {
			return ctx.prisma.message.findMany({
				where: {
					conversation: {
						participants: {
							some: {
								userId: ctx.session.user.id,
								leftAt: null,
							},
						},
					},
					conversationId: input.conversationId,
					content: {
						contains: input.query,
						mode: "insensitive",
					},
				},
				include: {
					sender: true,
					attachments: true,
					conversation: true,
				},
				orderBy: {
					createdAt: "desc",
				},
			});
		}),

	addReaction: protectedProcedure
		.input(z.object({
			messageId: z.string(),
			type: z.string(),
		}))
		.mutation(async ({ ctx, input }) => {
			// Check if user is participant in the conversation
			const message = await ctx.prisma.message.findUnique({
				where: { id: input.messageId },
				include: { conversation: { include: { participants: true } } },
			});

			if (!message) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Message not found",
				});
			}

			const isParticipant = message.conversation.participants.some(
				(p) => p.userId === ctx.session.user.id && !p.leftAt
			);

			if (!isParticipant) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You are not a participant in this conversation",
				});
			}

			// Upsert reaction (add if not exists, remove if exists)
			const existingReaction = await ctx.prisma.messageReaction.findUnique({
				where: {
					messageId_userId_type: {
						messageId: input.messageId,
						userId: ctx.session.user.id,
						type: input.type,
					},
				},
			});

			if (existingReaction) {
				await ctx.prisma.messageReaction.delete({
					where: { id: existingReaction.id },
				});
				return { action: "removed" };
			}

			await ctx.prisma.messageReaction.create({
				data: {
					messageId: input.messageId,
					userId: ctx.session.user.id,
					type: input.type,
				},
			});

			return { action: "added" };
		}),

	getReactions: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.messageReaction.findMany({
				where: { messageId: input },
				include: { user: true },
			});
		}),
});