import { configureStore } from '@reduxjs/toolkit';
import trackReducer from './trackSlice';

// Создаю Redux store - централизованное хранилище состояния приложения
// Использую функцию, чтобы избежать проблем с SSR в Next.js 15
const makeStore = () => {
  return configureStore({
    reducer: {
      track: trackReducer, // Подключаю reducer для управления состоянием треков и плеера
    },
  });
};

export const store = makeStore();

// Экспортирую типы для TypeScript - чтобы использовать в компонентах
export type RootState = ReturnType<typeof store.getState>; // Тип всего состояния
export type AppDispatch = typeof store.dispatch; // Тип для dispatch функций







