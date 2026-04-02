import apiClient from '../client';
import { Conversation, ChatMessage, ConversationsFilter } from '../../models/chat';
import { CHAT_API_BASE_URL } from '../config';

class ChatService {
    async getConversations(params?: ConversationsFilter): Promise<Conversation[]> {
        const response = await apiClient.get(`${CHAT_API_BASE_URL}/v1/chat/admin/conversations`, { params });
        return response.data;
    }

    async getConversation(conversationId: string): Promise<Conversation> {
        const response = await apiClient.get(`${CHAT_API_BASE_URL}/v1/chat/admin/conversations/${conversationId}`);
        return response.data;
    }

    async updateConversation(
        conversationId: string,
        data: { assignee_admin_id?: number | null; status?: 'open' | 'closed' }
    ): Promise<Conversation> {
        const response = await apiClient.patch(`${CHAT_API_BASE_URL}/v1/chat/admin/conversations/${conversationId}`, data);
        return response.data;
    }

    async getMessages(conversationId: string, limit: number = 100): Promise<ChatMessage[]> {
        const response = await apiClient.get(`${CHAT_API_BASE_URL}/v1/chat/admin/conversations/${conversationId}/messages`, {
            params: { limit }
        });
        return response.data;
    }

    async sendMessage(conversationId: string, body: string, clientMsgId: string): Promise<ChatMessage> {
        const response = await apiClient.post(`${CHAT_API_BASE_URL}/v1/chat/admin/conversations/${conversationId}/messages`, {
            client_msg_id: clientMsgId,
            type: 'text',
            body
        });
        return response.data;
    }
}

export const chatService = new ChatService();
