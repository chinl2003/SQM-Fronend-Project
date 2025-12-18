import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function ChatInput({
    onSendMessage,
    disabled,
    placeholder = "Nhập tin nhắn...",
}: ChatInputProps) {
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (!message.trim() || disabled) return;

        onSendMessage(message.trim());
        setMessage("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t p-4 bg-background">
            <div className="flex gap-2 items-end">
                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="min-h-[60px] max-h-[120px] resize-none"
                    rows={2}
                />
                <Button
                    onClick={handleSend}
                    disabled={disabled || !message.trim()}
                    size="icon"
                    className="h-[60px] w-[60px] shrink-0"
                >
                    <Send className="h-5 w-5" />
                </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
                Nhấn Enter để gửi, Shift + Enter để xuống dòng
            </p>
        </div>
    );
}
