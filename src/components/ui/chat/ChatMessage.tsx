import { ChatMessage as ChatMessageType, ChatMessageType as MessageType } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { VendorRecommendationCard } from "./VendorRecommendationCard";

interface ChatMessageProps {
    message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isBot = message.senderType === "Bot";
    const isRecommendation = message.messageType === MessageType.VendorRecommendation;

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div
            className={cn(
                "flex gap-3 mb-4 animate-in fade-in-0 slide-in-from-bottom-2",
                isBot ? "justify-start" : "justify-end"
            )}
        >
            {isBot && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
            )}

            <div className={cn("flex flex-col gap-2 max-w-[80%]", !isBot && "items-end")}>
                {/* Message bubble */}
                <div
                    className={cn(
                        "rounded-lg px-4 py-2",
                        isBot
                            ? "bg-muted text-foreground"
                            : "bg-primary text-primary-foreground"
                    )}
                >
                    <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                    </p>
                </div>

                {/* Vendor recommendation card (if applicable) */}
                {isRecommendation && isBot && message.vendorRecommendation && (
                    <div className="w-full max-w-sm">
                        <VendorRecommendationCard
                            recommendation={message.vendorRecommendation}
                        />
                    </div>
                )}

                {/* Timestamp */}
                <span className="text-xs text-muted-foreground px-1">
                    {formatTime(message.createdAt)}
                </span>
            </div>

            {!isBot && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                </div>
            )}
        </div>
    );
}
