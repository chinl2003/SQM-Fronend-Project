import { useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Bot } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";

interface ChatDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ChatDialog({ isOpen, onClose }: ChatDialogProps) {
    const {
        messages,
        conversationId,
        isConnected,
        isSending,
        isLoading,
        error,
        sendMessage,
        createConversation,
    } = useChat();

    // Create conversation when dialog opens if no conversation exists
    useEffect(() => {
        if (isOpen && !conversationId && isConnected) {
            createConversation();
        }
    }, [isOpen, conversationId, isConnected, createConversation]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        Trợ lý AI - Gợi ý nhà hàng
                    </DialogTitle>
                    <DialogDescription>
                        Hỏi tôi về nhà hàng, quán ăn phù hợp với bạn
                    </DialogDescription>
                </DialogHeader>

                {/* Connection Error */}
                {error && (
                    <div className="px-6 py-2">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </div>
                )}

                {/* Messages */}
                <ChatMessageList
                    messages={messages}
                    isLoading={isLoading}
                    isSending={isSending}
                />

                {/* Input */}
                <ChatInput
                    onSendMessage={sendMessage}
                    disabled={!isConnected || isSending}
                    placeholder={
                        !isConnected
                            ? "Đang kết nối..."
                            : "Hỏi về nhà hàng, quán ăn..."
                    }
                />

                {/* Footer */}
                <div className="px-6 py-3 border-t bg-muted/30">
                    <p className="text-xs text-center text-muted-foreground">
                        💡 Hỗ trợ bởi AI - Dữ liệu được cập nhật theo thời gian thực
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
