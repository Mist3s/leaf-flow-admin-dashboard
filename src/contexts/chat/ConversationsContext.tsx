import React, { createContext, useContext } from 'react';
import { Conversation } from '../../models/chat';

// === State ===

export interface ConversationsState {
    conversations: Conversation[];
    totalUnread: number;
}

export const initialConversationsState: ConversationsState = {
    conversations: [],
    totalUnread: 0,
};

// === Actions ===

export type ConversationsAction =
    | { type: 'LOADED'; conversations: Conversation[] }
    | { type: 'CONVERSATION_CREATED'; conversation: Conversation }
    | { type: 'CONVERSATION_UPDATED'; conversationId: string; changes: Partial<Conversation> }
    | { type: 'MESSAGE_RECEIVED'; conversationId: string; preview: string; timestamp: string }
    | { type: 'UNREAD_UPDATED'; conversationId: string; unreadCount: number }
    | { type: 'UNREAD_INCREMENT'; conversationId: string };

// === Helpers ===

function sortByLastMessage(conversations: Conversation[]): Conversation[] {
    return [...conversations].sort(
        (a, b) =>
            new Date(b.last_message_at || b.created_at).getTime() -
            new Date(a.last_message_at || a.created_at).getTime()
    );
}

function calcTotalUnread(conversations: Conversation[]): number {
    return conversations.reduce((sum, c) => sum + c.unread_count, 0);
}

function updateConversation(
    conversations: Conversation[],
    conversationId: string,
    updater: (c: Conversation) => Conversation
): Conversation[] {
    return conversations.map((c) =>
        c.id === conversationId ? updater(c) : c
    );
}

// === Reducer ===

export function conversationsReducer(
    state: ConversationsState,
    action: ConversationsAction
): ConversationsState {
    switch (action.type) {
        case 'LOADED': {
            const conversations = sortByLastMessage(action.conversations);
            return { conversations, totalUnread: calcTotalUnread(conversations) };
        }

        case 'CONVERSATION_CREATED': {
            // Не добавлять дубль
            if (state.conversations.some((c) => c.id === action.conversation.id)) {
                return state;
            }
            const conversations = sortByLastMessage([
                action.conversation,
                ...state.conversations,
            ]);
            return { conversations, totalUnread: calcTotalUnread(conversations) };
        }

        case 'CONVERSATION_UPDATED': {
            const conversations = updateConversation(
                state.conversations,
                action.conversationId,
                (c) => ({ ...c, ...action.changes })
            );
            return { conversations, totalUnread: calcTotalUnread(conversations) };
        }

        case 'MESSAGE_RECEIVED': {
            const conversations = sortByLastMessage(
                updateConversation(
                    state.conversations,
                    action.conversationId,
                    (c) => ({
                        ...c,
                        last_message_preview: action.preview,
                        last_message_at: action.timestamp,
                    })
                )
            );
            return { conversations, totalUnread: calcTotalUnread(conversations) };
        }

        case 'UNREAD_UPDATED': {
            const conversations = updateConversation(
                state.conversations,
                action.conversationId,
                (c) => ({ ...c, unread_count: action.unreadCount })
            );
            return { conversations, totalUnread: calcTotalUnread(conversations) };
        }

        case 'UNREAD_INCREMENT': {
            const conversations = updateConversation(
                state.conversations,
                action.conversationId,
                (c) => ({ ...c, unread_count: c.unread_count + 1 })
            );
            return { conversations, totalUnread: calcTotalUnread(conversations) };
        }

        default:
            return state;
    }
}

// === Context ===

const ConversationsContext = createContext<ConversationsState>(initialConversationsState);

export const ConversationsProvider = ConversationsContext.Provider;

export function useConversations(): ConversationsState {
    return useContext(ConversationsContext);
}
