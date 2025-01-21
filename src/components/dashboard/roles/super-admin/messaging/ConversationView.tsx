import { useEffect, useRef, useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { LuArrowLeft, LuPaperclip, LuSend } from "react-icons/lu";

type ConversationViewProps = {
	conversationId: string;
	onBack: () => void;
};

export default function ConversationView({
	conversationId,
	onBack,
}: ConversationViewProps) {
	const [newMessage, setNewMessage] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);

	const { data: conversation, isLoading } = api.message.getConversation.useQuery(
		conversationId
	);

	const utils = api.useContext();
	const sendMessage = api.message.sendMessage.useMutation({
		onSuccess: () => {
			setNewMessage("");
			utils.message.getConversation.invalidate(conversationId);
		},
	});

	const markAsRead = api.message.markAsRead.useMutation();

	useEffect(() => {
		if (conversationId) {
			markAsRead.mutate(conversationId);
		}
	}, [conversationId]);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [conversation?.messages]);

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!conversation) {
		return <div>Conversation not found</div>;
	}

	const otherParticipants = conversation.participants.filter(
		(p) => p.user.id !== "current-user-id"
	);
	const title =
		conversation.title ||
		otherParticipants.map((p) => p.user.name).join(", ");

	const handleSend = () => {
		if (newMessage.trim()) {
			sendMessage.mutate({
				conversationId,
				content: newMessage.trim(),
			});
		}
	};

	return (
		<div className="h-full flex flex-col">
			<div className="flex items-center gap-4 p-4 border-b">
				<Button variant="ghost" size="icon" onClick={onBack}>
					<LuArrowLeft className="h-4 w-4" />
				</Button>
				{conversation.type === "DIRECT" ? (
					<Avatar>
						<AvatarImage
							src={otherParticipants[0]?.user.image}
							alt={otherParticipants[0]?.user.name}
						/>
						<AvatarFallback>
							{otherParticipants[0]?.user.name?.[0].toUpperCase()}
						</AvatarFallback>
					</Avatar>
				) : (
					<Avatar>
						<AvatarFallback>{title[0].toUpperCase()}</AvatarFallback>
					</Avatar>
				)}
				<div>
					<h3 className="font-semibold">{title}</h3>
					<p className="text-sm text-muted-foreground">
						{conversation.participants.length} participants
					</p>
				</div>
			</div>

			<ScrollArea ref={scrollRef} className="flex-1 p-4">
				<div className="space-y-4">
					{conversation.messages.map((message) => (
						<div
							key={message.id}
							className={`flex ${
								message.sender.id === "current-user-id"
									? "justify-end"
									: "justify-start"
							}`}
						>
							<div className="flex gap-2 max-w-[70%]">
								{message.sender.id !== "current-user-id" && (
									<Avatar>
										<AvatarImage
											src={message.sender.image}
											alt={message.sender.name}
										/>
										<AvatarFallback>
											{message.sender.name?.[0].toUpperCase()}
										</AvatarFallback>
									</Avatar>
								)}
								<div>
									<Card
										className={`p-3 ${
											message.sender.id === "current-user-id"
												? "bg-primary text-primary-foreground"
												: ""
										}`}
									>
										<p>{message.content}</p>
										{message.attachments?.map((attachment) => (
											<a
												key={attachment.id}
												href={attachment.url}
												target="_blank"
												rel="noopener noreferrer"
												className="block mt-2 text-sm text-blue-500 hover:underline"
											>
												{attachment.type.toLowerCase()} attachment
											</a>
										))}
									</Card>
									<div className="mt-1 text-xs text-muted-foreground">
										{format(new Date(message.createdAt), "MMM d, h:mm a")}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</ScrollArea>

			<div className="p-4 border-t">
				<div className="flex gap-2">
					<Input
						value={newMessage}
						onChange={(e) => setNewMessage(e.target.value)}
						placeholder="Type a message..."
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								handleSend();
							}
						}}
					/>
					<Button
						size="icon"
						variant="ghost"
						className="shrink-0"
						onClick={() => {
							// TODO: Implement file attachment
						}}
					>
						<LuPaperclip className="h-4 w-4" />
					</Button>
					<Button
						size="icon"
						className="shrink-0"
						onClick={handleSend}
						disabled={!newMessage.trim() || sendMessage.isLoading}
					>
						<LuSend className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}