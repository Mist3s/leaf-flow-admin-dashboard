import React, { createContext, useContext } from 'react';
import { ChatMessage } from '../../models/chat';

// === State ===

export interface ActiveChatState {
    conversationId: string | null;
    messages: ChatMessage[];
    nextCursor: string | null;
    hasOlderMessages: boolean;
    isLoadingOlder: boolean;
}

export const initialActiveChatState: ActiveChatState = {
    conversationId: null,
    messages: [],
    nextCursor: null,
    hasOlderMessages: false,
    isLoadingOlder: false,
};

// === Actions ===

export type ActiveChatAction =
    | { type: 'OPENED'; conversationId: string }
    | { type: 'CLOSED' }
    | { type: 'MESSAGES_LOADED'; messages: ChatMessage[]; cursor: string | null }
    | { type: 'OLDER_LOADING' }
    | { type: 'OLDER_LOADED'; messages: ChatMessage[]; cursor: string | null }
    | { type: 'MESSAGE_RECEIVED'; message: ChatMessage }
    | { type: 'OPTIMISTIC_SENT'; message: ChatMessage }
    | { type: 'OPTIMISTIC_CONFIRMED'; clientMsgId: string; message: ChatMessage }
    | { type: 'OPTIMISTIC_FAILED'; clientMsgId: string };

// === Reducer ===

export function activeChatReducer(
    state: ActiveChatState,
    action: ActiveChatAction
): ActiveChatState {
    switch (action.type) {
        case 'OPENED':
            return {
                ...initialActiveChatState,
                conversationId: action.conversationId,
            };

        case 'CLOSED':
            return initialActiveChatState;

        case 'MESSAGES_LOADED':
            return {
                ...state,
                messages: sortMessages(action.messages),
                nextCursor: action.cursor,
                hasOlderMessages: action.cursor !== null,
            };

        case 'OLDER_LOADING':
            return { ...state, isLoadingOlder: true };

        case 'OLDER_LOADED':
            return {
                ...state,
                messages: sortMessages([...action.messages, ...state.messages]),
                nextCursor: action.cursor,
                hasOlderMessages: action.cursor !== null,
                isLoadingOlder: false,
            };

        case 'MESSAGE_RECEIVED': {
            const { message } = action;

            // Дедупликация по id
            if (message.id && state.messages.some((m) => m.id === message.id)) {
                return state;
            }

            // Замена оптимистичного сообщения по client_msg_id
            if (message.client_msg_id) {
                const idx = state.messages.findIndex(
                    (m) => m.client_msg_id === message.client_msg_id
                );
                if (idx >= 0) {
                    const updated = [...state.messages];
                    updated[idx] = message;
                    return { ...state, messages: updated };
                }
            }

            return {
                ...state,
                messages: sortMessages([...state.messages, message]),
            };
        }

        case 'OPTIMISTIC_SENT':
            return {
                ...state,
                messages: [...state.messages, action.message],
            };

        case 'OPTIMISTIC_CONFIRMED': {
            const messages = state.messages.map((m) =>
                m.client_msg_id === action.clientMsgId ? action.message : m
            );
            return { ...state, messages };
        }

        case 'OPTIMISTIC_FAILED': {
            const messages = state.messages.filter(
                (m) => m.client_msg_id !== action.clientMsgId
            );
            return { ...state, messages };
        }

        default:
            return state;
    }
}

// === Helpers ===

function sortMessages(messages: ChatMessage[]): ChatMessage[] {
    return [...messages].sort(
        (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
}

// === Context ===

const ActiveChatContext = createContext<ActiveChatState>(initialActiveChatState);

export const ActiveChatProvider = ActiveChatContext.Provider;

export function useActiveChat(): ActiveChatState {
    return useContext(ActiveChatContext);
}
