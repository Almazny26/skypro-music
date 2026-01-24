'use client';

import { Provider } from 'react-redux';
import { store } from './store';

// Обертка для Redux Provider - нужна, потому что Provider должен быть клиентским компонентом
// Использую в layout.tsx, чтобы все страницы имели доступ к Redux store
export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}







