export enum ChatMessageType {
  Text = 1,
  VendorRecommendation = 2,
  System = 3,
}

export enum ConversationStatus {
  Active = 1,
  Closed = 2,
  Archived = 3,
}

export interface VendorRecommendation {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorAddress?: string;
  logoUrl?: string;
  averageRating: number;
  queueCount?: number;
  distance?: number;
  recommendationReason: string;
  score: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: "User" | "Bot";
  content: string;
  messageType: ChatMessageType;
  createdAt: string;
  vendorRecommendation?: VendorRecommendation;
}

export interface ChatConversation {
  id: string;
  userId: string;
  status: ConversationStatus;
  startedAt: string;
  endedAt?: string;
  lastMessageAt: string;
  messages: ChatMessage[];
}

export interface SendChatMessageRequest {
  conversationId?: string;
  message: string;
}
