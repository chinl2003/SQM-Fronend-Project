import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChatButtonProps {
    onClick: () => void;
    unreadCount?: number;
}

export function ChatButton({ onClick, unreadCount = 0 }: ChatButtonProps) {
    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Button
                onClick={onClick}
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all relative"
            >
                <MessageCircle className="h-6 w-6" />

                {unreadCount > 0 && (
                    <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-6 w-6 p-0 flex items-center justify-center rounded-full"
                    >
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                )}
            </Button>
        </div>
    );
}
