import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Track {
  _id: number;
  name: string;
  author: string;
  album: string;
  duration_in_seconds: number;
  track_file: string;
  release_date?: string;
  genre?: string[];
  logo?: string | null;
  stared_user?: number[];
}

interface TrackState {
  currentTrack: Track | null;
  isPlaying: boolean;
}

const initialState: TrackState = {
  currentTrack: null,
  isPlaying: false,
};

const trackSlice = createSlice({
  name: 'track',
  initialState,
  reducers: {
    setCurrentTrack: (state, action: PayloadAction<Track | null>) => {
      state.currentTrack = action.payload;
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    togglePlayPause: (state) => {
      if (state.currentTrack) {
        state.isPlaying = !state.isPlaying;
      }
    },
  },
});

export const { setCurrentTrack, setIsPlaying, togglePlayPause } = trackSlice.actions;
export default trackSlice.reducer;






