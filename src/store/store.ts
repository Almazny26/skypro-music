import { configureStore } from '@reduxjs/toolkit';
import trackReducer from './trackSlice';

const makeStore = () => {
  return configureStore({
    reducer: {
      track: trackReducer,
    },
  });
};

export const store = makeStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;







