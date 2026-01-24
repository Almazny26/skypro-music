import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Track } from '@/api/api';

// Экспортирую тип Track, чтобы использовать в других файлах
export type { Track };

// Определяю структуру состояния для треков и плеера
interface TrackState {
  currentTrack: Track | null; // Текущий трек, который играет (или null, если ничего не играет)
  isPlaying: boolean; // Флаг воспроизведения - играет ли сейчас трек
  currentTime: number; // Текущая позиция воспроизведения в секундах
  duration: number; // Общая длительность трека в секундах
  playlist: Track[]; // Список треков в плейлисте (учитывает поиск и фильтры)
}

// Начальное состояние - все пустое
const initialState: TrackState = {
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playlist: [],
};

// Создаю Redux slice для управления состоянием треков
const trackSlice = createSlice({
  name: 'track', // Имя для Redux DevTools
  initialState,
  reducers: {
    // Устанавливаю текущий трек - когда пользователь кликает на трек в списке
    setCurrentTrack: (state, action: PayloadAction<Track | null>) => {
      state.currentTrack = action.payload;
    },
    // Устанавливаю состояние воспроизведения (play/pause)
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    // Переключаю play/pause - если трек есть, меняю состояние на противоположное
    togglePlayPause: (state) => {
      if (state.currentTrack) {
        state.isPlaying = !state.isPlaying;
      }
    },
    // Обновляю текущее время - вызывается во время воспроизведения
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    // Устанавливаю длительность трека - получаю из метаданных аудио элемента
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    // Обновляю плейлист - используется при поиске, фильтрации и загрузке треков
    setPlaylist: (state, action: PayloadAction<Track[]>) => {
      state.playlist = action.payload;
    },
  },
});

// Экспортирую actions для использования в компонентах
export const {
  setCurrentTrack,
  setIsPlaying,
  togglePlayPause,
  setCurrentTime,
  setDuration,
  setPlaylist,
} = trackSlice.actions;
export default trackSlice.reducer;
