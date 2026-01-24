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

// Главный layout, который используется и на главной странице, и на странице подборок
// Принимает треки из пропсов, если они есть (например, с сервера), или загружает сам
export default function MainLayout({
  tracks: initialTracks,
  error: initialError,
  compilationId,
}: MainLayoutProps = {}) {
  const dispatch = useAppDispatch();
  const currentTrack = useAppSelector((state) => state.track.currentTrack);
  const isPlaying = useAppSelector((state) => state.track.isPlaying);
  const playlist = useAppSelector((state) => state.track.playlist);

  // Локальные состояния для управления плеером и фильтрами
  const [isShuffled, setIsShuffled] = useState(false);
  const [playedTracks, setPlayedTracks] = useState<number[]>([]); // Для режима перемешивания
  const [likedTracks, setLikedTracks] = useState<number[]>([]); // ID треков, которые лайкнул пользователь
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>(initialTracks || []);
  const [error, setError] = useState<string | null>(initialError || null);
  const [isLoading, setIsLoading] = useState(!initialTracks); // Если треки переданы, не показываю лоадер

  // Загружаю треки, если они не были переданы из пропсов (например, на главной странице)
  useEffect(() => {
    // Если треки уже есть (например, пришли с сервера на странице подборок), просто использую их
    if (initialTracks && initialTracks.length > 0) {
      setTracks(initialTracks);
      setIsLoading(false);
      return;
    }

    // Флаг для отмены запроса, если компонент размонтировался
    let cancelled = false;

    const loadTracks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const loadedTracks = await getTracks();
        // Проверяю, не размонтировался ли компонент во время загрузки
        if (cancelled) return;

        if (!loadedTracks || loadedTracks.length === 0) {
          setError('Треки не найдены. Возможно, требуется авторизация.');
        } else {
          setTracks(loadedTracks);
        }
      } catch (err) {
        if (cancelled) return;
        // Логирую только в dev режиме, чтобы не засорять консоль в production
        if (process.env.NODE_ENV === 'development') {
          console.error('Ошибка загрузки треков:', err);
        }
        const errorMessage =
          err instanceof Error
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

    // Cleanup функция - отменяю запрос при размонтировании
    return () => {
      cancelled = true;
    };
  }, [initialTracks]);

  // Когда треки загрузились, отправляю их в Redux store для плейлиста
  useEffect(() => {
    if (Array.isArray(tracks) && tracks.length > 0) {
      dispatch(setPlaylist(tracks));
    }
  }, [tracks, dispatch]);

  // Фильтрую треки по поисковому запросу - ищу в названии, авторе и альбоме
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

  // Когда кликают на трек в списке - либо запускаю его, либо ставлю на паузу, если он уже играет
  const handleTrackSelect = (track: Track) => {
    if (currentTrack?._id === track._id) {
      // Если это текущий трек - просто переключаю play/pause
      dispatch(togglePlayPause());
    } else {
      // Иначе запускаю новый трек
      dispatch(setCurrentTrack(track));
      dispatch(setIsPlaying(true));
      // Если включен shuffle, сбрасываю список проигранных треков
      if (isShuffled) {
        setPlayedTracks([track._id]);
      }
    }
  };

  // Обработчик кнопки play/pause в плеере
  const handlePlayPause = () => {
    // Если трека нет, но есть плейлист - запускаю первый трек
    if (!currentTrack && playlist.length > 0) {
      dispatch(setCurrentTrack(playlist[0]));
      dispatch(setIsPlaying(true));
    } else if (currentTrack) {
      // Иначе просто переключаю состояние
      dispatch(togglePlayPause());
    }
  };

  // Получаю следующий трек - учитываю режим shuffle
  const getNextTrack = (): Track | null => {
    if (!currentTrack) return null;

    if (isShuffled) {
      // В режиме перемешивания выбираю случайный трек из непроигранных
      const unplayedTracks = playlist.filter(
        (track) => !playedTracks.includes(track._id),
      );

      // Если все треки проиграны - сбрасываю список и выбираю случайный
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
      // В обычном режиме просто беру следующий по порядку
      const currentIndex = playlist.findIndex(
        (track) => track._id === currentTrack._id,
      );
      if (currentIndex !== -1) {
        // Если это последний трек - следующего нет
        if (currentIndex === playlist.length - 1) {
          return null;
        }
        const nextIndex = currentIndex + 1;
        return playlist[nextIndex];
      }
    }
    return null;
  };

  // Получаю предыдущий трек - всегда по порядку, shuffle не влияет
  const getPrevTrack = (): Track | null => {
    if (!currentTrack) return null;

    const currentIndex = playlist.findIndex(
      (track) => track._id === currentTrack._id,
    );
    if (currentIndex !== -1) {
      // Если это первый трек - предыдущего нет
      if (currentIndex === 0) {
        return null;
      }
      const prevIndex = currentIndex - 1;
      return playlist[prevIndex];
    }
    return null;
  };

  // Обработчик кнопки "следующий трек" в плеере
  const handleNextTrack = () => {
    if (!currentTrack) return;

    const nextTrack = getNextTrack();
    if (nextTrack) {
      // Если shuffle включен, добавляю текущий трек в список проигранных
      if (isShuffled) {
        setPlayedTracks((prev) => [...prev, currentTrack._id]);
      }
      dispatch(setCurrentTrack(nextTrack));
      dispatch(setIsPlaying(true));
    }
  };

  // Обработчик кнопки "предыдущий трек" в плеере
  const handlePrevTrack = () => {
    if (!currentTrack) return;

    const prevTrack = getPrevTrack();
    if (prevTrack) {
      dispatch(setCurrentTrack(prevTrack));
      dispatch(setIsPlaying(true));
    }
  };

  // Включаю/выключаю режим перемешивания
  const handleToggleShuffle = () => {
    setIsShuffled(!isShuffled);
    // При переключении сбрасываю список проигранных треков
    if (currentTrack) {
      setPlayedTracks([currentTrack._id]);
    } else {
      setPlayedTracks([]);
    }
  };

  // Добавляю/убираю лайк на треке - пока только локально, без сохранения на сервере
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
              <div
                style={{ color: '#fff', padding: '20px', textAlign: 'center' }}
              >
                Загрузка треков...
              </div>
            )}
            {error && (
              <div
                style={{ color: 'red', padding: '20px', textAlign: 'center' }}
              >
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
