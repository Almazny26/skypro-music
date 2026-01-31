'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
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
  getFavoriteTracks,
  addTrackToFavorites,
  removeTrackFromFavorites,
  getToken,
  removeToken,
} from '@/api/api';
import Navigation from '@/components/Navigation';
import Search from '@/components/Search';
import Filter from '@/components/Filter';
import Playlist from '@/components/Playlist';
import Sidebar from '@/components/Sidebar';
import PlayerBar from '@/components/PlayerBar';
import TracksLoader from '@/components/TracksLoader';
import {
  applyAllFilters,
  hasActiveFilters,
  type FilterState,
} from '@/utils/filterUtils';
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
  children?: React.ReactNode;
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
  children,
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
  const [filterAuthor, setFilterAuthor] = useState<string | null>(null);
  const [filterGenre, setFilterGenre] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [tracks, setTracks] = useState<Track[]>(initialTracks || []);
  const [error, setError] = useState<string | null>(initialError || null);
  const [compilationName, setCompilationName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(initialTracks === undefined);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [likingTrackId, setLikingTrackId] = useState<number | null>(null);
  const [dislikedTrackIds, setDislikedTrackIds] = useState<Set<number>>(new Set());
  const compilationIdRef = useRef<number | undefined>(compilationId);
  const requestCounterRef = useRef<number>(0);

  const DISLIKED_STORAGE_KEY = 'skypro_disliked_track_ids';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(DISLIKED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed) && parsed.every((id) => typeof id === 'number')) {
          setDislikedTrackIds(new Set(parsed as number[]));
        }
      }
    } catch {
      setDislikedTrackIds(new Set());
    }
  }, []);

  const addToDisliked = useCallback((trackId: number) => {
    setDislikedTrackIds((prev) => {
      const next = new Set(prev);
      next.add(trackId);
      try {
        localStorage.setItem(DISLIKED_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const removeFromDisliked = useCallback((trackId: number) => {
    setDislikedTrackIds((prev) => {
      const next = new Set(prev);
      next.delete(trackId);
      try {
        localStorage.setItem(DISLIKED_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Сброс поиска и фильтров при переходе на другую страницу
  useEffect(() => {
    setSearchQuery('');
    setFilterAuthor(null);
    setFilterGenre(null);
    setFilterYear(null);
  }, [compilationId]);

  // Если треки переданы извне, используем их
  useEffect(() => {
    if (initialTracks !== undefined) {
      setTracks(initialTracks);
      setError(initialError || null);
      setIsLoading(false);
      return;
    }
  }, [initialTracks, initialError]);

  // Загрузка лайков с сервера (только при наличии токена; при 401 токен сбрасывается в getFavoriteTracks)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadLikedTracks = async () => {
      const token = getToken();
      if (!token || token.trim() === '') {
        setLikedTracks([]);
        return;
      }
      try {
        const favoriteTracks = await getFavoriteTracks();
        setLikedTracks(favoriteTracks.map((t) => t._id));
      } catch {
        setLikedTracks([]);
      }
    };

    loadLikedTracks();
    const handleStorageChange = () => loadLikedTracks();
    window.addEventListener('localStorageChange', handleStorageChange);
    return () => window.removeEventListener('localStorageChange', handleStorageChange);
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
      if (currentCompilationId !== undefined && currentCompilationId !== null && !isNaN(currentCompilationId)) {
        setTracks([]);
      }

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
        const tracksToSet = loadedTracks || [];
        setTracks(tracksToSet);
        if (
          currentRequestId === requestCounterRef.current &&
          currentCompilationId === compilationIdRef.current
        ) {
          setCompilationName(compilationNameToSet);
        }
        if (
          currentCompilationId !== undefined &&
          currentCompilationId !== null &&
          !isNaN(currentCompilationId) &&
          tracksToSet.length === 0
        ) {
          setError('В этой подборке пока нет треков');
        } else {
          setError(null);
        }
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

  // Комбинированная фильтрация: поиск (по первым буквам названия), автор, жанр, год; сортировка по дате
  const filterState: FilterState = useMemo(
    () => ({
      searchQuery,
      author: filterAuthor,
      genre: filterGenre,
      year: filterYear,
    }),
    [searchQuery, filterAuthor, filterGenre, filterYear]
  );

  const displayedTracks = useMemo(
    () => applyAllFilters(tracks, filterState, 'desc'),
    [tracks, filterState]
  );

  const tracksForPlaylist = useMemo(
    () => displayedTracks.filter((t) => !dislikedTrackIds.has(t._id)),
    [displayedTracks, dislikedTrackIds]
  );

  useEffect(() => {
    dispatch(setPlaylist(tracksForPlaylist));
  }, [tracksForPlaylist, dispatch]);

  const handleFilterSelect = useCallback(
    (type: 'author' | 'genre' | 'year', value: string | number | null) => {
      if (type === 'author') setFilterAuthor(value as string | null);
      else if (type === 'genre') setFilterGenre(value as string | null);
      else if (type === 'year') setFilterYear(value as number | null);
    },
    []
  );

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

  const handleDislike = useCallback(() => {
    if (!currentTrack) return;
    const token = getToken();
    if (!token || token.trim() === '') {
      toast.info('Войдите, чтобы использовать «Не рекомендовать»');
      return;
    }
    addToDisliked(currentTrack._id);
    handleNextTrack();
    toast.info('Трек скрыт из рекомендаций');
  }, [currentTrack, addToDisliked, handleNextTrack]);

  const isCurrentTrackDisliked = useMemo(
    () => (currentTrack ? dislikedTrackIds.has(currentTrack._id) : false),
    [currentTrack, dislikedTrackIds]
  );

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

  // Переключение лайка трека (с сервером по документации API, fallback на localStorage при ошибке)
  const handleToggleLike = useCallback(async (trackId: number) => {
    if (likingTrackId === trackId) return;

    const token = getToken();
    if (!token || token.trim() === '') {
      toast.info('Войдите, чтобы добавить треки в избранное');
      return;
    }

    setLikingTrackId(trackId);
    setLikeError(null);

    const isCurrentlyLiked = likedTracks.includes(trackId);
    const previousLikedTracks = [...likedTracks];
    const previousTracks = [...tracks];

    const newLikedTracks = isCurrentlyLiked
      ? likedTracks.filter((id) => id !== trackId)
      : [...likedTracks, trackId];
    setLikedTracks(newLikedTracks);

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

    try {
      if (isCurrentlyLiked) {
        await removeTrackFromFavorites(trackId);
      } else {
        await addTrackToFavorites(trackId);
      }
      try {
        const favoriteTracks = await getFavoriteTracks();
        setLikedTracks(favoriteTracks.map((t) => t._id));
        const updatedTracks = await getTracks();
        setTracks(updatedTracks);
      } catch {
        // обновление списка после лайка не критично
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('favoritesUpdated'));
        if (onRemoveFromFavorites && isCurrentlyLiked) {
          onRemoveFromFavorites(trackId);
        }
      }
    } catch (err) {
      setLikedTracks(previousLikedTracks);
      setTracks(previousTracks);
      const msg = err instanceof Error ? err.message : 'Не удалось обновить избранное.';
      const isAuthError = msg.includes('токен') || msg.includes('401') || msg.includes('Токен') || msg.includes('недействителен');
      if (isAuthError) {
        removeToken();
      }
      setLikeError(isAuthError ? 'Токен недействителен или истек. Войдите заново.' : msg);
      setTimeout(() => setLikeError(null), 5000);
    } finally {
      setLikingTrackId(null);
    }
  }, [likingTrackId, likedTracks, onRemoveFromFavorites, tracks]);

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

  // Если передан children (например, страница избранного в состоянии загрузки/ошибки), рендерим оболочку с ним
  if (children !== undefined) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.container}>
          <main className={styles.main}>
            <Navigation />
            <div className={styles.centerblock}>
              {children}
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
            onDislike={handleDislike}
            isDisliked={isCurrentTrackDisliked}
          />
          <footer className={styles.footer}></footer>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <main className={styles.main}>
          <Navigation />

          <div className={styles.centerblock}>
            <Search value={searchQuery} onSearchChange={handleSearchChange} />
            <h2 className={styles.h2}>{pageTitle || compilationName || 'Треки'}</h2>
            <Filter
              tracks={tracks}
              selectedAuthor={filterAuthor}
              selectedGenre={filterGenre}
              selectedYear={filterYear}
              onFilterSelect={handleFilterSelect}
            />
            {isLoading && <TracksLoader />}
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
              <>
                {displayedTracks.length === 0 && hasActiveFilters(filterState) ? (
                  <p className={styles.emptyMessage}>Нет подходящих треков</p>
                ) : displayedTracks.length === 0 ? (
                  <p className={styles.emptyMessage}>Нет треков для воспроизведения</p>
                ) : (
                  <Playlist
                    tracks={displayedTracks}
                    likedTracks={likedTracks}
                    onTrackSelect={handleTrackSelect}
                    onToggleLike={handleToggleLike}
                    removingTrackId={removingTrackId}
                  />
                )}
              </>
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
          onDislike={handleDislike}
          isDisliked={isCurrentTrackDisliked}
        />
        <footer className={styles.footer}></footer>
      </div>
    </div>
  );
}
