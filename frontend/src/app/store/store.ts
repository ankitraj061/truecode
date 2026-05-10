import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/app/slices/authSlice';
import problemReducer from '@/app/slices/problemSlice';
import chatReducer from '@/app/slices/chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    problem: problemReducer,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
