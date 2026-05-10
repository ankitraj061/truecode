import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Message {
    timestamp: unknown;
    role: 'user' | 'assistant';
    content: string;
}

interface ChatState {
    [problemId: string]: Message[]; // Store messages per problem
}

const initialState: ChatState = {};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        addMessage: (state, action: PayloadAction<{ problemId: string; message: Message }>) => {
            const { problemId, message } = action.payload;
            if (!state[problemId]) {
                state[problemId] = [];
            }
            state[problemId].push(message);
        },
        setMessages: (state, action: PayloadAction<{ problemId: string; messages: Message[] }>) => {
            const { problemId, messages } = action.payload;
            state[problemId] = messages;
        },
        clearMessages: (state, action: PayloadAction<string>) => {
            delete state[action.payload];
        },
        clearAllChats: () => initialState
    }
});

export const { addMessage, setMessages, clearMessages, clearAllChats } = chatSlice.actions;
export default chatSlice.reducer;
