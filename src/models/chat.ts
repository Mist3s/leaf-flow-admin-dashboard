export type TopicType = 'support' | 'order';
export type ConversationStatus = 'open' | 'closed';

export interface Conversation {
  id: string;
  topic_type: TopicType;
  topic_id: number | null;
  status: ConversationStatus;
  assignee_admin_id: number | null;
  user_id: number | null;
  user_name: string;
  admin_name: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export type SenderKind = 'user' | 'admin';
export type MessageType = 'text' | 'system' | 'attachment';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_kind: SenderKind;
  sender_id: number;
  type: MessageType;
  body: string;
  payload: any | null;
  client_msg_id: string;
  created_at: string;
}

export interface ConversationsFilter {
  status?: ConversationStatus;
  assignee_admin_id?: number; // 0 for unassigned
  cursor?: string;
  limit?: number;
}
