import {
    HubConnection,
    HubConnectionBuilder,
    LogLevel,
    HttpTransportType,
} from "@microsoft/signalr";
import { ChatMessage } from "@/types/chat";

class ChatService {
    private connection: HubConnection | null = null;
    private messageCallbacks: ((message: ChatMessage) => void)[] = [];

    async connect(token: string): Promise<void> {
        if (this.connection?.state === "Connected") {
            return;
        }

        const apiBaseUrl = import.meta.env.VITE_API_URL;

        this.connection = new HubConnectionBuilder()
            .withUrl(`${apiBaseUrl}/hubs/chat`, {
                accessTokenFactory: () => token,
                transport: HttpTransportType.LongPolling,
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        this.connection.on("ReceiveChatMessage", (message: ChatMessage) => {
            console.log("Received chat message:", message);
            this.messageCallbacks.forEach((callback) => callback(message));
        });

        this.connection.on("Error", (error: string) => {
            console.error("Chat error:", error);
        });

        try {
            await this.connection.start();
            console.log("Chat SignalR connected");
        } catch (error) {
            console.error("Failed to connect to chat hub:", error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
        }
    }

    async sendMessage(
        conversationId: string | null,
        message: string
    ): Promise<void> {
        if (!this.connection) {
            throw new Error("Not connected to chat hub");
        }

        try {
            await this.connection.invoke("SendMessage", conversationId, message);
        } catch (error) {
            console.error("Failed to send message:", error);
            throw error;
        }
    }

    onMessage(callback: (message: ChatMessage) => void): () => void {
        this.messageCallbacks.push(callback);

        // Return cleanup function
        return () => {
            const index = this.messageCallbacks.indexOf(callback);
            if (index > -1) {
                this.messageCallbacks.splice(index, 1);
            }
        };
    }

    isConnected(): boolean {
        return this.connection?.state === "Connected";
    }
}

export const chatService = new ChatService();
