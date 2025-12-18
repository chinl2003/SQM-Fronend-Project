import { useState, useEffect, useCallback, useRef } from "react";
import { chatService } from "@/lib/chatService";
import { chatApi } from "@/lib/api";
import { ChatMessage, ChatConversation } from "@/types/chat";
import { toast } from "sonner";

export function useChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    // Initialize SignalR connection
    useEffect(() => {
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token") || "";

        if (!token) {
            setError("No authentication token found");
            return;
        }

        const connect = async () => {
            try {
                await chatService.connect(token);
                setIsConnected(true);
                setError(null);

                // Set up message listener
                const cleanup = chatService.onMessage((message: ChatMessage) => {
                    setMessages((prev) => [...prev, message]);

                    // Auto-scroll would be handled by the component
                    if (message.senderType === "Bot") {
                        // Optional: show toast for bot messages
                        // toast.info("AI Assistant", { description: "New message received" });
                    }
                });

                cleanupRef.current = cleanup;
            } catch (err) {
                console.error("Failed to connect:", err);
                setError("Failed to connect to chat service");
                setIsConnected(false);
            }
        };

        connect();

        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
            }
            chatService.disconnect();
        };
    }, []);

    // Load conversation history when conversation ID changes
    useEffect(() => {
        if (!conversationId) return;

        const loadHistory = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("accessToken") || localStorage.getItem("token") || "";
                const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

                const response = await chatApi.getConversation(conversationId, headers);
                // The API response is already unwrapped, so response is the conversation directly
                const conversation = response as unknown as ChatConversation;

                if (!conversation) {
                    console.error("Invalid conversation response:", response);
                    throw new Error("Invalid conversation response");
                }

                setMessages(conversation.messages || []);
                setError(null);
            } catch (err) {
                console.error("Failed to load conversation:", err);
                toast.error("Không thể tải lịch sử trò chuyện");
            } finally {
                setIsLoading(false);
            }
        };

        loadHistory();
    }, [conversationId]);

    // Send message
    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;
        if (!isConnected) {
            toast.error("Chưa kết nối đến dịch vụ chat");
            return;
        }

        setIsSending(true);
        setError(null);

        try {
            // Send via SignalR
            await chatService.sendMessage(conversationId, content);

            // The response will come through the SignalR message listener
        } catch (err) {
            console.error("Failed to send message:", err);
            setError("Failed to send message");
            toast.error("Không thể gửi tin nhắn");
            setIsSending(false);
        }
    }, [conversationId, isConnected]);

    // Create new conversation
    const createConversation = useCallback(async () => {
        try {
            const token = localStorage.getItem("accessToken") || localStorage.getItem("token") || "";
            const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

            const response = await chatApi.createConversation(headers);

            // The API response is already unwrapped by api.ts, so response is the conversation directly
            const conversation = response as unknown as ChatConversation;

            if (!conversation || !conversation.id) {
                console.error("Invalid conversation response:", response);
                throw new Error("Invalid conversation response");
            }

            setConversationId(conversation.id);
            setMessages([]);
            setError(null);

            return conversation.id;
        } catch (err) {
            console.error("Failed to create conversation:", err);
            toast.error("Không thể bắt đầu cuộc trò chuyện");
            throw err;
        }
    }, []);

    // Close conversation
    const closeConversation = useCallback(async () => {
        if (!conversationId) return;

        try {
            const token = localStorage.getItem("accessToken") || localStorage.getItem("token") || "";
            const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

            await chatApi.closeConversation(conversationId, headers);
            setConversationId(null);
            setMessages([]);
        } catch (err) {
            console.error("Failed to close conversation:", err);
        }
    }, [conversationId]);

    // Mark as not sending when new messages arrive
    useEffect(() => {
        if (messages.length > 0 && isSending) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.senderType === "Bot") {
                setIsSending(false);
            }
        }
    }, [messages, isSending]);

    return {
        messages,
        conversationId,
        isConnected,
        isSending,
        isLoading,
        error,
        sendMessage,
        createConversation,
        closeConversation,
    };
}
