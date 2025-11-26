import { configureStore } from '@reduxjs/toolkit';
import trackReducer from './trackSlice';

// Создаю Redux store - централизованное хранилище состояния
export const store = configureStore({
  reducer: {
    track: trackReducer, // подключаю reducer для управления треками
  },
});

// Экспортирую типы для TypeScript
// RootState - тип всего состояния store
export type RootState = ReturnType<typeof store.getState>;
// AppDispatch - тип для dispatch функций
export type AppDispatch = typeof store.dispatch;







