'use client';

import { ThemeProvider } from './themeProvider';
import { Provider } from "react-redux";
import { store } from "@/app/store/store";
import AuthInitializer from '../components/AuthInitailizer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Provider store={store}>
      <AuthInitializer>
        {children}
        </AuthInitializer>
      
      </Provider>
    </ThemeProvider>
  );
}
