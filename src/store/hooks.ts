import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Типизированные хуки для работы с Redux
// Использую withTypes, чтобы TypeScript автоматически понимал типы состояния и dispatch
// Это удобнее, чем каждый раз указывать типы вручную
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
