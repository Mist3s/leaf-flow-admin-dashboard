import { ACCESS_TOKEN_KEY, WS_CHAT_URL } from '../api/config';
import { WsOutboundEvent } from '../models/chat';

type EventHandler = (event: WsOutboundEvent) => void;

/**
 * Чистый WebSocket-транспорт для чата.
 * Не знает о React. Только отправка/получение типизированных событий.
 */
class ChatWebSocket {
    private ws: WebSocket | null = null;

    private handlers = new Set<EventHandler>();

    private isConnecting = false;

    private reconnectAttempts = 0;

    private maxReconnectAttempts = 5;

    private messageQueue: string[] = [];

    private pingInterval: ReturnType<typeof setInterval> | null = null;

    private onReconnectCallback: (() => void) | null = null;


    connect() {
        if (this.ws || this.isConnecting) return;

        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (!token) return;

        this.isConnecting = true;
        this.ws = new WebSocket(`${WS_CHAT_URL}?token=${token}`);

        this.ws.onopen = () => {
            const wasReconnect = this.reconnectAttempts > 0;
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.flushQueue();
            this.startPing();

            if (wasReconnect && this.onReconnectCallback) {
                this.onReconnectCallback();
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data) as WsOutboundEvent;
                this.handlers.forEach((h) => h(msg));
            } catch (e) {
                console.error('[ChatWS] Failed to parse:', e, event.data);
            }
        };

        this.ws.onclose = () => {
            this.cleanup();
            this.handleReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('[ChatWS] Error:', error);
            this.ws?.close();
        };
    }

    disconnect() {
        this.reconnectAttempts = this.maxReconnectAttempts;
        this.ws?.close();
        this.cleanup();
    }

    subscribe(conversationId: string) {
        this.send('subscribe', { conversation_id: conversationId });
    }

    sendMessage(conversationId: string, body: string, clientMsgId: string) {
        this.send('message.send', {
            conversation_id: conversationId,
            client_msg_id: clientMsgId,
            type: 'text',
            body,
        });
    }

    markRead(conversationId: string, lastMessageId: string) {
        this.send('mark_read', {
            conversation_id: conversationId,
            last_message_id: lastMessageId,
        });
    }

    /** Подписка на все входящие WS-события. Возвращает unsubscribe. */
    onEvent(handler: EventHandler): () => void {
        this.handlers.add(handler);
        return () => this.handlers.delete(handler);
    }

    /** Колбэк, вызываемый при успешном реконнекте (для рефреша данных). */
    setOnReconnect(callback: (() => void) | null) {
        this.onReconnectCallback = callback;
    }

    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    // --- Private ---

    private send(type: string, data: Record<string, unknown>) {
        const payload = JSON.stringify({ type, data });
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(payload);
        } else {
            this.messageQueue.push(payload);
        }
    }

    private flushQueue() {
        while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift()!;
            this.ws?.send(msg);
        }
    }

    private startPing() {
        this.stopPing();
        this.pingInterval = setInterval(() => {
            this.send('ping', {});
        }, 30_000);
    }

    private stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    private cleanup() {
        this.ws = null;
        this.isConnecting = false;
        this.stopPing();
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
        }
    }
}

export const chatWsClient = new ChatWebSocket();
