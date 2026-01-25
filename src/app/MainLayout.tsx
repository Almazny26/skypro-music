'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCurrentTrack,
  setIsPlaying,
  togglePlayPause,
  setPlaylist,
} from '@/store/trackSlice';
import type { Track } from '@/api/api';
import { getTracks, getCompilation } from '@/api/api';
import Navigation from '@/components/Navigation';
import Search from '@/components/Search';
import Filter from '@/components/Filter';
import Playlist from '@/components/Playlist';
import Sidebar from '@/components/Sidebar';
import PlayerBar from '@/components/PlayerBar';
import styles from './page.module.css';

// Типы для пропсов компонента
interface MainLayoutProps {
  tracks?: Track[];
  error?: string | null;
  compilationId?: number;
}

// Главный компонент приложения
export default function MainLayout({
  tracks: initialTracks,
  error: initialError,
  compilationId,
}: MainLayoutProps = {}) {
  // Redux хуки для работы со store
  const dispatch = useAppDispatch();
  const currentTrack = useAppSelector((state) => state.track.currentTrack);
  const isPlaying = useAppSelector((state) => state.track.isPlaying);
  const playlist = useAppSelector((state) => state.track.playlist);

  // Локальное состояние компонента
  const [isShuffled, setIsShuffled] = useState(false);
  const [playedTracks, setPlayedTracks] = useState<number[]>([]);
  const [likedTracks, setLikedTracks] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>(initialTracks || []);
  const [error, setError] = useState<string | null>(initialError || null);
  const [compilationName, setCompilationName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(initialTracks === undefined);
  // useRef для хранения значений между рендерами
  const compilationIdRef = useRef<number | undefined>(compilationId);
  const requestCounterRef = useRef<number>(0);
  const isFirstMountRef = useRef<boolean>(true);

  // Если треки переданы извне, используем их
  useEffect(() => {
    if (initialTracks !== undefined) {
      setTracks(initialTracks);
      setError(initialError || null);
      setIsLoading(false);
      return;
    }
  }, [initialTracks, initialError]);

  // Загрузка треков с сервера
  useEffect(() => {
    if (initialTracks !== undefined) {
      return;
    }

    // Флаг для отмены запроса если компонент размонтирован
    let cancelled = false;
    compilationIdRef.current = compilationId;
    requestCounterRef.current += 1;
    const currentRequestId = requestCounterRef.current;
    const currentCompilationId = compilationId;

    // Асинхронная функция загрузки треков
    const loadTracks = async () => {
      setIsLoading(true);
      setError(null);

      // Маппинг названий подборок
      const compilationNames: Record<number, string> = {
        1: 'Плейлист дня',
        2: '100 танцевальных хитов',
        3: 'Инди-заряд',
      };

      // Устанавливаем название подборки
      if (
        currentCompilationId !== undefined &&
        currentCompilationId !== null &&
        !isNaN(currentCompilationId)
      ) {
        const mappedName =
          compilationNames[currentCompilationId] ||
          `Подборка ${currentCompilationId}`;
        setCompilationName(mappedName);
      }

      try {
        let loadedTracks: Track[];
        let compilationNameToSet: string | null = null;

        // Загружаем подборку или все треки
        if (
          currentCompilationId !== undefined &&
          currentCompilationId !== null &&
          !isNaN(currentCompilationId)
        ) {
          const compilation = await getCompilation(currentCompilationId);
          loadedTracks = compilation.tracks || [];

          // Если треков нет, но есть items, загружаем все треки и фильтруем
          if (
            loadedTracks.length === 0 &&
            compilation.items &&
            compilation.items.length > 0
          ) {
            if (cancelled) return;
            if (currentRequestId !== requestCounterRef.current) return;
            if (currentCompilationId !== compilationIdRef.current) return;

            try {
              const allTracks = await getTracks();

              if (cancelled) return;
              if (currentRequestId !== requestCounterRef.current) return;
              if (currentCompilationId !== compilationIdRef.current) return;

              // Фильтруем треки по items и сортируем по порядку
              loadedTracks = allTracks.filter((track) =>
                compilation.items!.includes(track._id),
              );
              const itemsOrder = compilation.items;
              loadedTracks.sort((a, b) => {
                const indexA = itemsOrder!.indexOf(a._id);
                const indexB = itemsOrder!.indexOf(b._id);
                return indexA - indexB;
              });
            } catch (err) {
              if (cancelled) return;
              if (currentRequestId !== requestCounterRef.current) return;
              if (currentCompilationId !== compilationIdRef.current) return;
            }
          }

          // Устанавливаем название подборки
          if (currentCompilationId && compilationNames[currentCompilationId]) {
            compilationNameToSet = compilationNames[currentCompilationId];
          } else if (currentCompilationId) {
            compilationNameToSet =
              compilation.name && compilation.name.trim()
                ? compilation.name
                : `Подборка ${currentCompilationId}`;
          } else {
            compilationNameToSet = null;
          }
        } else {
          // Загружаем все треки если нет подборки
          loadedTracks = await getTracks();
          compilationNameToSet = null;
        }

        // Проверки на актуальность запроса
        if (cancelled) {
          setIsLoading(false);
          return;
        }

        if (currentRequestId !== requestCounterRef.current) {
          setIsLoading(false);
          return;
        }

        if (currentCompilationId !== compilationIdRef.current) {
          setIsLoading(false);
          return;
        }

        // Сохраняем загруженные треки
        setTracks(loadedTracks || []);
        if (
          currentRequestId === requestCounterRef.current &&
          currentCompilationId === compilationIdRef.current
        ) {
          setCompilationName(compilationNameToSet);
        }
        setError(null);
      } catch (err) {
        if (cancelled) return;
        // Обработка ошибок
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Произошла ошибка при загрузке треков';
        setError(errorMessage);
        setTracks([]);
        setCompilationName(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadTracks();

    // Очистка при размонтировании
    return () => {
      cancelled = true;
      requestCounterRef.current += 1;
    };
  }, [initialTracks, compilationId]);

  // Сбрасываем воспроизведение при первом монтировании
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      if (isPlaying) {
        dispatch(setIsPlaying(false));
      }
    }
  }, [dispatch, isPlaying]);

  // Обновляем ref при изменении compilationId
  useEffect(() => {
    compilationIdRef.current = compilationId;

    if (
      compilationId === undefined ||
      compilationId === null ||
      isNaN(compilationId)
    ) {
      setCompilationName(null);
    }
  }, [compilationId]);

  // Фильтрация треков по поисковому запросу
  useEffect(() => {
    if (!Array.isArray(tracks)) {
      dispatch(setPlaylist([]));
      return;
    }

    // Фильтруем по названию, автору или альбому
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

  // Обработчик выбора трека
  const handleTrackSelect = (track: Track) => {
    if (currentTrack?._id === track._id) {
      // Если выбран текущий трек, пауза/плей
      dispatch(togglePlayPause());
    } else {
      // Иначе выбираем новый трек
      dispatch(setCurrentTrack(track));
      dispatch(setIsPlaying(true));
      if (isShuffled) {
        setPlayedTracks([track._id]);
      }
    }
  };

  // Обработчик плей/паузы
  const handlePlayPause = () => {
    if (!currentTrack && playlist.length > 0) {
      // Если нет текущего трека, играем первый
      dispatch(setCurrentTrack(playlist[0]));
      dispatch(setIsPlaying(true));
    } else if (currentTrack) {
      dispatch(togglePlayPause());
    }
  };

  // Получить следующий трек
  const getNextTrack = (): Track | null => {
    if (!currentTrack) return null;

    if (isShuffled) {
      // Режим перемешивания
      const unplayedTracks = playlist.filter(
        (track) => !playedTracks.includes(track._id),
      );

      if (unplayedTracks.length === 0) {
        // Все треки проиграны, начинаем заново
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
      // Обычный режим - следующий по порядку
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

  // Получить предыдущий трек
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

  // Переключение на следующий трек
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

  // Переключение на предыдущий трек
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

  // Переключение лайка трека
  const handleToggleLike = (trackId: number) => {
    setLikedTracks((prev) => {
      if (prev.includes(trackId)) {
        return prev.filter((id) => id !== trackId);
      } else {
        return [...prev, trackId];
      }
    });
  };

  // Обработчик изменения поискового запроса
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <main className={styles.main}>
          <Navigation />

          <div className={styles.centerblock}>
            <Search onSearchChange={handleSearchChange} />
            <h2 className={styles.h2}>{compilationName || 'Треки'}</h2>
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
                tracks={playlist.length > 0 ? playlist : tracks}
                likedTracks={likedTracks}
                onTrackSelect={handleTrackSelect}
                onToggleLike={handleToggleLike}
              />
            )}
          </div>

          <Sidebar />
        </main>

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
