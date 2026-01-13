import { configureStore } from '@reduxjs/toolkit';
import trackReducer from './trackSlice';

// Функция для создания store - безопасно для Next.js 15
const makeStore = () => {
  return configureStore({
    reducer: {
      track: trackReducer, // подключаю reducer для управления треками
    },
  });
};

// Создаю Redux store - централизованное хранилище состояния
// Используем функцию для создания, чтобы избежать проблем с SSR в Next.js 15
export const store = makeStore();

// Экспортирую типы для TypeScript
// RootState - тип всего состояния store
export type RootState = ReturnType<typeof store.getState>;
// AppDispatch - тип для dispatch функций
export type AppDispatch = typeof store.dispatch;







