'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCurrentTrack,
  setIsPlaying,
  togglePlayPause,
  setPlaylist,
} from '@/store/trackSlice';
import type { Track } from '@/api/api';
import { getTracks } from '@/api/api';
import Navigation from '@/components/Navigation';
import Search from '@/components/Search';
import Filter from '@/components/Filter';
import Playlist from '@/components/Playlist';
import Sidebar from '@/components/Sidebar';
import PlayerBar from '@/components/PlayerBar';
import styles from './page.module.css';

interface MainLayoutProps {
  tracks?: Track[];
  error?: string | null;
  compilationId?: number;
}

// Единый Layout для главной страницы и страницы подборок
export default function MainLayout({ tracks: initialTracks, error: initialError, compilationId }: MainLayoutProps = {}) {
  const dispatch = useAppDispatch();
  const currentTrack = useAppSelector((state) => state.track.currentTrack);
  const isPlaying = useAppSelector((state) => state.track.isPlaying);
  const playlist = useAppSelector((state) => state.track.playlist);
  // Локальные состояния компонента
  const [isShuffled, setIsShuffled] = useState(false);
  const [playedTracks, setPlayedTracks] = useState<number[]>([]);
  const [likedTracks, setLikedTracks] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>(initialTracks || []);
  const [error, setError] = useState<string | null>(initialError || null);
  const [isLoading, setIsLoading] = useState(!initialTracks);

  // Загружаем треки на клиенте, если они не были переданы
  useEffect(() => {
    if (initialTracks && initialTracks.length > 0) {
      setTracks(initialTracks);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadTracks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Загрузка треков...');
        const loadedTracks = await getTracks();
        console.log('Загружено треков:', loadedTracks?.length || 0);
        if (cancelled) return;
        
        if (!loadedTracks || loadedTracks.length === 0) {
          setError('Треки не найдены. Возможно, требуется авторизация.');
        } else {
          setTracks(loadedTracks);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Ошибка загрузки треков:', err);
        const errorMessage = err instanceof Error
          ? err.message
          : 'Произошла ошибка при загрузке треков';
        setError(errorMessage);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadTracks();

    return () => {
      cancelled = true;
    };
  }, [initialTracks]);

  // При первой загрузке страницы загружаем треки в плейлист
  useEffect(() => {
    if (Array.isArray(tracks) && tracks.length > 0) {
      dispatch(setPlaylist(tracks));
    }
  }, [tracks, dispatch]);

  // Когда меняется поисковый запрос, фильтруем треки
  useEffect(() => {
    if (!Array.isArray(tracks) || tracks.length === 0) return;
    
    const filtered = searchQuery
      ? tracks.filter(
          (track) =>
            track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            track.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
            track.album.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : tracks;
    dispatch(setPlaylist(filtered));
  }, [searchQuery, tracks, dispatch]);

  // Обработчик клика на трек в списке
  const handleTrackSelect = (track: Track) => {
    if (currentTrack?._id === track._id) {
      dispatch(togglePlayPause());
    } else {
      dispatch(setCurrentTrack(track));
      dispatch(setIsPlaying(true));
      if (isShuffled) {
        setPlayedTracks([track._id]);
      }
    }
  };

  const handlePlayPause = () => {
    if (!currentTrack && playlist.length > 0) {
      dispatch(setCurrentTrack(playlist[0]));
      dispatch(setIsPlaying(true));
    } else if (currentTrack) {
      dispatch(togglePlayPause());
    }
  };

  // Функция для получения следующего трека
  const getNextTrack = (): Track | null => {
    if (!currentTrack) return null;

    if (isShuffled) {
      const unplayedTracks = playlist.filter(
        (track) => !playedTracks.includes(track._id),
      );

      if (unplayedTracks.length === 0) {
        setPlayedTracks([currentTrack._id]);
        const availableTracks = playlist.filter(
          (track) => track._id !== currentTrack._id,
        );
        if (availableTracks.length === 0) return null;
        const randomTrack =
          availableTracks[Math.floor(Math.random() * availableTracks.length)];
        return randomTrack;
      }

      const randomTrack =
        unplayedTracks[Math.floor(Math.random() * unplayedTracks.length)];
      return randomTrack;
    } else {
      const currentIndex = playlist.findIndex(
        (track) => track._id === currentTrack._id,
      );
      if (currentIndex !== -1) {
        if (currentIndex === playlist.length - 1) {
          return null;
        }
        const nextIndex = currentIndex + 1;
        return playlist[nextIndex];
      }
    }
    return null;
  };

  // Функция для получения предыдущего трека
  const getPrevTrack = (): Track | null => {
    if (!currentTrack) return null;

    const currentIndex = playlist.findIndex(
      (track) => track._id === currentTrack._id,
    );
    if (currentIndex !== -1) {
      if (currentIndex === 0) {
        return null;
      }
      const prevIndex = currentIndex - 1;
      return playlist[prevIndex];
    }
    return null;
  };

  // Обработчик кнопки "следующий трек"
  const handleNextTrack = () => {
    if (!currentTrack) return;

    const nextTrack = getNextTrack();
    if (nextTrack) {
      if (isShuffled) {
        setPlayedTracks((prev) => [...prev, currentTrack._id]);
      }
      dispatch(setCurrentTrack(nextTrack));
      dispatch(setIsPlaying(true));
    }
  };

  // Обработчик кнопки "предыдущий трек"
  const handlePrevTrack = () => {
    if (!currentTrack) return;

    const prevTrack = getPrevTrack();
    if (prevTrack) {
      dispatch(setCurrentTrack(prevTrack));
      dispatch(setIsPlaying(true));
    }
  };

  // Переключение режима перемешивания
  const handleToggleShuffle = () => {
    setIsShuffled(!isShuffled);
    if (currentTrack) {
      setPlayedTracks([currentTrack._id]);
    } else {
      setPlayedTracks([]);
    }
  };

  // Переключение лайка на треке
  const handleToggleLike = (trackId: number) => {
    setLikedTracks((prev) => {
      if (prev.includes(trackId)) {
        return prev.filter((id) => id !== trackId);
      } else {
        return [...prev, trackId];
      }
    });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <main className={styles.main}>
          {/* Левая навигационная панель с меню */}
          <Navigation />

          {/* Центральный блок с поиском, фильтрами и списком треков */}
          <div className={styles.centerblock}>
            <Search onSearchChange={handleSearchChange} />
            <h2 className={styles.h2}>Треки</h2>
            <Filter tracks={tracks} />
            {isLoading && (
              <div style={{ color: '#fff', padding: '20px', textAlign: 'center' }}>
                Загрузка треков...
              </div>
            )}
            {error && (
              <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
                {error}
              </div>
            )}
            {!isLoading && !error && (
              <Playlist
                tracks={playlist}
                likedTracks={likedTracks}
                onTrackSelect={handleTrackSelect}
                onToggleLike={handleToggleLike}
              />
            )}
          </div>

          {/* Правая боковая панель с плейлистами */}
          <Sidebar />
        </main>

        {/* Плеер внизу страницы - фиксированная позиция */}
        <PlayerBar
          isLiked={
            currentTrack ? likedTracks.includes(currentTrack._id) : false
          }
          isShuffled={isShuffled}
          onPlayPause={handlePlayPause}
          onNextTrack={handleNextTrack}
          onPrevTrack={handlePrevTrack}
          onToggleShuffle={handleToggleShuffle}
          onToggleLike={
            currentTrack ? () => handleToggleLike(currentTrack._id) : () => {}
          }
        />
        <footer className={styles.footer}></footer>
      </div>
    </div>
  );
}
