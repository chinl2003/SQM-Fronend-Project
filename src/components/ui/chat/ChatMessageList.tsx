import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage as ChatMessageType } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
import { Loader2 } from "lucide-react";

interface ChatMessageListProps {
    messages: ChatMessageType[];
    isLoading?: boolean;
    isSending?: boolean;
}

export function ChatMessageList({
    messages,
    isLoading,
    isSending,
}: ChatMessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Đang tải cuộc trò chuyện...</p>
                </div>
            </div>
        );
    }

    return (
        <ScrollArea className="flex-1 px-4">
            <div className="py-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="text-4xl mb-4">🤖</div>
                        <h3 className="font-semibold text-lg mb-2">
                            Xin chào! Tôi là trợ lý AI
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Tôi có thể giúp bạn tìm kiếm nhà hàng, quán ăn phù hợp với nhu cầu
                            của bạn. Hãy thử hỏi tôi về:
                        </p>
                        <ul className="text-sm text-muted-foreground mt-3 space-y-1">
                            <li>• "Tìm nhà hàng có đánh giá cao"</li>
                            <li>• "Quán nào ít người xếp hàng?"</li>
                            <li>• "Gợi ý món ăn ngon gần đây"</li>
                        </ul>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <ChatMessage key={`${message.id}-${index}`} message={message} />
                        ))}

                        {/* Typing indicator */}
                        {isSending && (
                            <div className="flex gap-3 mb-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                    <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                                </div>
                                <div className="bg-muted rounded-lg px-4 py-3">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-100" />
                                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-200" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={bottomRef} />
            </div>
        </ScrollArea>
    );
}
