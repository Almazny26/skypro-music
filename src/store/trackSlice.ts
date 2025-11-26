import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Описываю структуру трека - все поля которые приходят с бэкенда
export interface Track {
  _id: number;
  name: string;
  author: string;
  album: string;
  duration_in_seconds: number;
  track_file: string;
  release_date?: string; // необязательное поле, может не быть
  genre?: string[];
  logo?: string | null;
  stared_user?: number[];
}

// Состояние для Redux - что храним в store
interface TrackState {
  currentTrack: Track | null; // текущий трек который играет, или null если ничего не играет
  isPlaying: boolean; // играет ли сейчас трек
  currentTime: number; // сколько секунд уже прошло
  duration: number; // общая длительность трека в секундах
  playlist: Track[]; // список треков в текущем плейлисте (с учетом поиска)
}

// Начальное состояние - все пустое
const initialState: TrackState = {
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playlist: [], // изначально пустой массив
};

// Создаю slice для управления состоянием треков
const trackSlice = createSlice({
  name: 'track', // имя для devtools
  initialState,
  reducers: {
    // Устанавливаем текущий трек
    setCurrentTrack: (state, action: PayloadAction<Track | null>) => {
      state.currentTrack = action.payload; // просто заменяем трек
    },
    // Устанавливаем состояние воспроизведения (играет/не играет)
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    // Переключаем play/pause - если есть трек, меняем состояние
    togglePlayPause: (state) => {
      if (state.currentTrack) {
        state.isPlaying = !state.isPlaying; // инвертируем булевое значение
      }
    },
    // Обновляем текущее время воспроизведения
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    // Устанавливаем длительность трека (получаем из метаданных аудио)
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    // Обновляем плейлист (например, при поиске)
    setPlaylist: (state, action: PayloadAction<Track[]>) => {
      state.playlist = action.payload;
    },
  },
});

export const {
  setCurrentTrack,
  setIsPlaying,
  togglePlayPause,
  setCurrentTime,
  setDuration,
  setPlaylist,
} = trackSlice.actions;
export default trackSlice.reducer;
