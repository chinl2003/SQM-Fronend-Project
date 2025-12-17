import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatButtonProps {
    onClick: () => void;
    unreadCount?: number;
    className?: string;
}

export function ChatButton({
    onClick,
    unreadCount = 0,
    className,
}: ChatButtonProps) {
    return (
        <Button
            onClick={onClick}
            size="lg"
            className={cn(
                "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50",
                className
            )}
        >
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs">
                    {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
            )}
        </Button>
    );
}
