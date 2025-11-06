import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Clock, CheckCircle2 } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: "customer" | "vendor";
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface VendorChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
  vendorImage: string;
  orderId: string;
}

const mockMessages: Message[] = [
  {
    id: "1",
    senderId: "vendor1",
    senderName: "Pizza Palace",
    senderType: "vendor",
    message:
      "Chào bạn! Đơn hàng của bạn đang được chuẩn bị. Dự kiến hoàn thành trong 15 phút nữa.",
    timestamp: "2024-01-15T14:35:00Z",
    isRead: true,
  },
  {
    id: "2",
    senderId: "customer1",
    senderName: "Khách hàng",
    senderType: "customer",
    message: "Cảm ơn quán! Tôi có thể thêm một ly nước ngọt không ạ?",
    timestamp: "2024-01-15T14:37:00Z",
    isRead: true,
  },
];

export function VendorChatDialog({
  isOpen,
  onClose,
  vendorName,
  vendorImage,
  orderId,
}: VendorChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);

    const message: Message = {
      id: Date.now().toString(),
      senderId: "customer1",
      senderName: "Bạn",
      senderType: "customer",
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    // Simulate sending
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <img
              src={vendorImage}
              alt={vendorName}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1">
              <span>{vendorName}</span>
              <div className="text-xs text-muted-foreground font-normal">
                Đơn hàng #{orderId.slice(-6)}
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Đang xử lý
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderType === "customer"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    message.senderType === "customer"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <div className="flex items-center justify-end mt-1 space-x-1">
                    <span className="text-xs opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {message.senderType === "customer" && (
                      <div className="text-xs opacity-70">
                        {message.isRead ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex space-x-2 pt-4 border-t">
          <Input
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
