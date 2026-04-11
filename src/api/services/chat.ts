import apiClient from '../client';
import {
    Conversation,
    ChatMessage,
    ConversationsFilter,
    MessagesFilter,
    PaginatedResponse
} from '../../models/chat';
import { CHAT_API_BASE_URL } from '../config';

const BASE = `${CHAT_API_BASE_URL}/v1/chat/admin`;

class ChatService {
    async getConversations(
        params?: ConversationsFilter
    ): Promise<PaginatedResponse<Conversation>> {
        const response = await apiClient.get(`${BASE}/conversations`, { params });
        return response.data;
    }

    async getConversation(conversationId: string): Promise<Conversation> {
        const response = await apiClient.get(
            `${BASE}/conversations/${conversationId}`
        );
        return response.data;
    }

    async updateConversation(
        conversationId: string,
        data: { assignee_admin_id?: number | null; status?: 'open' | 'closed' }
    ): Promise<Conversation> {
        const response = await apiClient.patch(
            `${BASE}/conversations/${conversationId}`,
            data
        );
        return response.data;
    }

    async getMessages(
        conversationId: string,
        params?: MessagesFilter
    ): Promise<PaginatedResponse<ChatMessage>> {
        const response = await apiClient.get(
            `${BASE}/conversations/${conversationId}/messages`,
            { params: { limit: 50, ...params } }
        );
        return response.data;
    }

    async sendMessage(
        conversationId: string,
        body: string,
        clientMsgId: string
    ): Promise<ChatMessage> {
        const response = await apiClient.post(
            `${BASE}/conversations/${conversationId}/messages`,
            { client_msg_id: clientMsgId, type: 'text', body }
        );
        return response.data;
    }
}

export const chatService = new ChatService();
