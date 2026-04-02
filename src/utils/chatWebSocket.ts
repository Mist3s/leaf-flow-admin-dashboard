import { ACCESS_TOKEN_KEY, WS_CHAT_URL } from '../api/config';
import { ChatMessage } from '../models/chat';

type WsEventType = 'subscribe' | 'message.send' | 'mark_read';

interface WsMessageOut {
    type: WsEventType;
    data: any;
}

export type ChatMessageHandler = (conversationId: string, message: ChatMessage) => void;
export type ConversationUpdateHandler = (conversationId: string, action: string) => void;

class ChatWebSocket {
    private ws: WebSocket | null = null;

    private messageHandlers: Set<ChatMessageHandler> = new Set();

    private updateHandlers: Set<ConversationUpdateHandler> = new Set();

    private isConnecting = false;

    private reconnectAttempts = 0;

    private maxReconnectAttempts = 5;

    private messageQueue: WsMessageOut[] = [];

    connect() {
        if (this.ws || this.isConnecting) return;

        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (!token) return;

        this.isConnecting = true;

        const url = `${WS_CHAT_URL}?token=${token}`;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            // Flush queue
            while (this.messageQueue.length > 0) {
                const queuedMsg = this.messageQueue.shift();
                if (queuedMsg) this.ws?.send(JSON.stringify(queuedMsg));
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                // Обработка любых сообщений (гибкая проверка типа)
                const isMessage = msg.type === 'message.created' || msg.type === 'message_created' || msg.type === 'new_message' || msg.type === 'chat.message_created';
                const isUpdate = msg.type?.includes('conversation') || msg.topic_type;

                if (isMessage) {
                    const data = msg.data || msg;
                    // В новом формате весь объект data является самим сообщением (содержит body, type и т.д.)
                    const messageInfo = data.message || data;

                    // У сервера поле называется message_id вместо id
                    if (messageInfo.message_id && !messageInfo.id) {
                        messageInfo.id = messageInfo.message_id;
                    }

                    // У сервера может отсутствовать created_at
                    if (!messageInfo.created_at) {
                        messageInfo.created_at = new Date().toISOString();
                    }

                    const convId = data.conversation_id || data.id || messageInfo.conversation_id || messageInfo.id;
                    if (convId && messageInfo) this.notifyMessageHandlers(convId, messageInfo);
                } else if (isUpdate) {
                    const data = msg.data || msg;
                    const convId = data.conversation_id || data.id;
                    if (convId) this.notifyUpdateHandlers(convId, msg.type || 'updated');
                } else if (msg.conversation_id) { // Fallback, если сервер не прислал `type`
                    if (msg.body) this.notifyMessageHandlers(msg.conversation_id, msg);
                    else this.notifyUpdateHandlers(msg.conversation_id, 'updated');
                }
            } catch (e) {
                console.error('Failed to parse WS message', e, event.data);
            }
        };

        this.ws.onclose = () => {
            this.ws = null;
            this.isConnecting = false;
            this.handleReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('Chat WS Error:', error);
            this.ws?.close();
        };
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
        }
    }

    subscribe(conversationId: string) {
        this.send({ type: 'subscribe', data: { conversation_id: conversationId } });
    }

    sendMessage(conversationId: string, body: string, clientMsgId: string) {
        this.send({
            type: 'message.send',
            data: {
                conversation_id: conversationId,
                client_msg_id: clientMsgId,
                type: 'text',
                body
            }
        });
    }

    markRead(conversationId: string, lastMessageId: string) {
        this.send({
            type: 'mark_read',
            data: {
                conversation_id: conversationId,
                last_message_id: lastMessageId
            }
        });
    }

    private send(msg: WsMessageOut) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        } else {
            this.messageQueue.push(msg); // Сохраняем в очередь, если WS еще не открыт
        }
    }

    onMessage(handler: ChatMessageHandler) {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    onUpdate(handler: ConversationUpdateHandler) {
        this.updateHandlers.add(handler);
        return () => this.updateHandlers.delete(handler);
    }

    private notifyMessageHandlers(conversationId: string, message: ChatMessage) {
        this.messageHandlers.forEach(h => h(conversationId, message));
    }

    private notifyUpdateHandlers(conversationId: string, action: string) {
        this.updateHandlers.forEach(h => h(conversationId, action));
    }
}

export const chatWsClient = new ChatWebSocket();
