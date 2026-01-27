'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCurrentTrack,
  setIsPlaying,
  togglePlayPause,
  setPlaylist,
} from '@/store/trackSlice';
import type { Track } from '@/api/api';
import {
  getTracks,
  getCompilation,
  getToken,
  removeToken,
  getCurrentUserId,
} from '@/api/api';
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
  onRemoveFromFavorites?: (trackId: number) => void;
  removingTrackId?: number | null;
  removeError?: string | null;
  pageTitle?: string;
}

// Главный компонент приложения
export default function MainLayout({
  tracks: initialTracks,
  error: initialError,
  compilationId,
  onRemoveFromFavorites,
  removingTrackId,
  removeError,
  pageTitle,
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
  const [likeError, setLikeError] = useState<string | null>(null);
  const [likingTrackId, setLikingTrackId] = useState<number | null>(null);
  // useRef для хранения значений между рендерами
  const compilationIdRef = useRef<number | undefined>(compilationId);
  const requestCounterRef = useRef<number>(0);

  // Если треки переданы извне, используем их
  useEffect(() => {
    if (initialTracks !== undefined) {
      setTracks(initialTracks);
      setError(initialError || null);
      setIsLoading(false);
      return;
    }
  }, [initialTracks, initialError]);

  // Загрузка лайков из localStorage (локальное хранение)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedLikes = localStorage.getItem('likedTracks');
      if (savedLikes) {
        const likedTrackIds = JSON.parse(savedLikes);
        if (Array.isArray(likedTrackIds)) {
          setLikedTracks(likedTrackIds);
        }
      }
    } catch (err) {
      setLikedTracks([]);
    }
  }, []);

  // Очистка невалидного токена при загрузке
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token === 'undefined' || token === 'null' || (token && token.trim() === '')) {
      removeToken();
    }
  }, []);

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
        if (cancelled) {
          return;
        }
        // Обработка ошибок
        let errorMessage =
          err instanceof Error
            ? err.message
            : 'Произошла ошибка при загрузке треков';
        
        // Улучшаем сообщения об ошибках сети
        if (errorMessage.includes('подключиться к серверу') || 
            errorMessage.includes('недоступен') ||
            errorMessage.includes('Failed to fetch')) {
          errorMessage = 'Сервер недоступен. Проверьте подключение к интернету и VPN (если требуется).';
        } else if (errorMessage.includes('Превышено время ожидания')) {
          errorMessage = 'Сервер не отвечает. Проверьте подключение к интернету и VPN (если требуется).';
        }
        
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

  // Обработчик выбора трека (мемоизирован)
  const handleTrackSelect = useCallback((track: Track) => {
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
  }, [currentTrack?._id, isShuffled, dispatch]);

  // Обработчик плей/паузы (мемоизирован)
  const handlePlayPause = useCallback(() => {
    if (!currentTrack && playlist.length > 0) {
      // Если нет текущего трека, играем первый
      dispatch(setCurrentTrack(playlist[0]));
      dispatch(setIsPlaying(true));
    } else if (currentTrack) {
      dispatch(togglePlayPause());
    }
  }, [currentTrack, playlist, dispatch]);

  // Переключение на следующий трек (мемоизирован)
  const handleNextTrack = useCallback(() => {
    if (!currentTrack) return;

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
        if (availableTracks.length === 0) return;
        const randomTrack =
          availableTracks[Math.floor(Math.random() * availableTracks.length)];
        dispatch(setCurrentTrack(randomTrack));
        dispatch(setIsPlaying(true));
        return;
      }

      const randomTrack =
        unplayedTracks[Math.floor(Math.random() * unplayedTracks.length)];
      setPlayedTracks((prev) => [...prev, currentTrack._id]);
      dispatch(setCurrentTrack(randomTrack));
      dispatch(setIsPlaying(true));
    } else {
      // Обычный режим - следующий по порядку
      const currentIndex = playlist.findIndex(
        (track) => track._id === currentTrack._id,
      );
      if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
        const nextIndex = currentIndex + 1;
        dispatch(setCurrentTrack(playlist[nextIndex]));
        dispatch(setIsPlaying(true));
      }
    }
  }, [currentTrack, isShuffled, playlist, playedTracks, dispatch]);

  // Переключение на предыдущий трек (мемоизирован)
  const handlePrevTrack = useCallback(() => {
    if (!currentTrack) return;

    const currentIndex = playlist.findIndex(
      (track) => track._id === currentTrack._id,
    );
    if (currentIndex !== -1 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      dispatch(setCurrentTrack(playlist[prevIndex]));
      dispatch(setIsPlaying(true));
    }
  }, [currentTrack, playlist, dispatch]);

  // Переключение режима перемешивания (мемоизирован)
  const handleToggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      const newValue = !prev;
      if (currentTrack) {
        setPlayedTracks([currentTrack._id]);
      } else {
        setPlayedTracks([]);
      }
      return newValue;
    });
  }, [currentTrack]);

  // Переключение лайка трека (локальное хранение)
  const handleToggleLike = useCallback((trackId: number) => {
    // Предотвращаем множественные клики
    if (likingTrackId === trackId) return;

    setLikingTrackId(trackId);
    setLikeError(null);

    // Определяем, лайкнут ли трек локально
    const isCurrentlyLiked = likedTracks.includes(trackId);

    // Обновляем локальное состояние лайков
    const newLikedTracks = isCurrentlyLiked
      ? likedTracks.filter((id) => id !== trackId)
      : [...likedTracks, trackId];
    
    setLikedTracks(newLikedTracks);

    // Сохраняем в localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('likedTracks', JSON.stringify(newLikedTracks));
      } catch (err) {
        // Ошибка при сохранении в localStorage
      }
    }

    // Обновляем количество лайков в треке оптимистично
    setTracks((prevTracks) =>
      prevTracks.map((track) => {
        if (track._id === trackId) {
          const currentLikes = track.stared_user || [];
          const newLikesCount = isCurrentlyLiked
            ? Math.max(0, currentLikes.length - 1)
            : currentLikes.length + 1;
          
          return {
            ...track,
            stared_user: Array.from({ length: newLikesCount }, (_, i) => i + 1),
          };
        }
        return track;
      }),
    );

    // Отправляем событие обновления избранного для страницы favorites
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('favoritesUpdated'));
      
      // Если есть обработчик удаления из избранного (для страницы favorites)
      if (onRemoveFromFavorites && isCurrentlyLiked) {
        onRemoveFromFavorites(trackId);
      }
    }

    setLikingTrackId(null);
  }, [likingTrackId, likedTracks, onRemoveFromFavorites]);

  // Обработчик изменения поискового запроса (мемоизирован)
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Мемоизированные значения для PlayerBar
  const isCurrentTrackLiked = useMemo(() => 
    currentTrack ? likedTracks.includes(currentTrack._id) : false,
    [currentTrack?._id, likedTracks]
  );

  const handleCurrentTrackToggleLike = useMemo(() => 
    currentTrack ? () => handleToggleLike(currentTrack._id) : () => {},
    [currentTrack?._id, handleToggleLike]
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <main className={styles.main}>
          <Navigation />

          <div className={styles.centerblock}>
            <Search onSearchChange={handleSearchChange} />
            <h2 className={styles.h2}>{pageTitle || compilationName || 'Треки'}</h2>
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
            {likeError && (
              <div
                style={{
                  color: '#ff6b6b',
                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  padding: '12px 20px',
                  textAlign: 'center',
                  borderRadius: '4px',
                  marginBottom: '10px',
                  border: '1px solid rgba(255, 107, 107, 0.3)',
                }}
              >
                {likeError}
              </div>
            )}
            {removeError && (
              <div
                style={{
                  color: '#ff6b6b',
                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  padding: '12px 20px',
                  textAlign: 'center',
                  borderRadius: '4px',
                  marginBottom: '10px',
                  border: '1px solid rgba(255, 107, 107, 0.3)',
                }}
              >
                {removeError}
              </div>
            )}
            {!isLoading && !error && (
              <Playlist
                tracks={playlist.length > 0 ? playlist : tracks}
                likedTracks={likedTracks}
                onTrackSelect={handleTrackSelect}
                onToggleLike={handleToggleLike}
                removingTrackId={removingTrackId}
              />
            )}
          </div>

          <Sidebar />
        </main>

        <PlayerBar
          isLiked={isCurrentTrackLiked}
          isShuffled={isShuffled}
          onPlayPause={handlePlayPause}
          onNextTrack={handleNextTrack}
          onPrevTrack={handlePrevTrack}
          onToggleShuffle={handleToggleShuffle}
          onToggleLike={handleCurrentTrackToggleLike}
        />
        <footer className={styles.footer}></footer>
      </div>
    </div>
  );
}
