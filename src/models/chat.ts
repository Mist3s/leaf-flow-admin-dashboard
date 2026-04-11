// === Доменные типы ===

export type TopicType = 'support' | 'order';
export type ConversationStatus = 'open' | 'closed';
export type SenderKind = 'user' | 'admin';
export type MessageType = 'text' | 'system' | 'attachment';

export interface Conversation {
  id: string;
  topic_type: TopicType;
  topic_id: string | null;
  status: ConversationStatus;
  assignee_admin_id: number | null;
  user_id: number | null;
  user_name: string | null;
  admin_name: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  last_message_preview: string | null;
  unread_count: number;
}

export interface MessagePayload {
  action: 'assigned' | 'closed';
  admin_id?: number;
  admin_name?: string;
  user_id?: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_kind: SenderKind;
  sender_id: number;
  type: MessageType;
  body: string;
  payload: MessagePayload | null;
  client_msg_id: string;
  created_at: string;
}

// === API типы ===

export interface PaginatedResponse<T> {
  items: T[];
  next_cursor: string | null;
}

export interface ConversationsFilter {
  status?: ConversationStatus;
  assignee_admin_id?: number;
  cursor?: string;
  limit?: number;
}

export interface MessagesFilter {
  cursor?: string;
  limit?: number;
}

// === WS типы (Server → Client) ===

export interface WsMessageCreated {
  type: 'message.created';
  data: { conversation_id: string; message: ChatMessage };
}

export interface WsConversationUpdated {
  type: 'conversation.updated';
  data: {
    conversation_id: string;
    action: 'assigned' | 'closed';
    assignee_admin_id?: number | null;
    admin_name?: string | null;
    status?: ConversationStatus;
  };
}

export interface WsConversationCreated {
  type: 'conversation.created';
  data: {
    conversation_id: string;
    user_id: number;
    user_name: string;
    topic_type: TopicType;
  };
}

export interface WsReadStateUpdated {
  type: 'read_state.updated';
  data: { conversation_id: string; unread_count: number };
}

export interface WsPong {
  type: 'pong';
  data: Record<string, never>;
}

export interface WsError {
  type: 'error';
  data: { code: string; detail?: string };
}

export type WsOutboundEvent =
  | WsMessageCreated
  | WsConversationUpdated
  | WsConversationCreated
  | WsReadStateUpdated
  | WsPong
  | WsError;
