'use client';

// Импортируем стили для главной страницы
import styles from './page.module.css';
// Импортируем все компоненты, из которых состоит главная страница
// @ - это алиас для папки src, настроен в tsconfig.json
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCurrentTrack,
  setIsPlaying,
  togglePlayPause,
  setPlaylist,
} from '@/store/trackSlice';
import type { Track } from '@/store/trackSlice';
import Navigation from '@/components/Navigation';
import Search from '@/components/Search';
import Filter from '@/components/Filter';
import Playlist from '@/components/Playlist';
import Sidebar from '@/components/Sidebar';
import PlayerBar from '@/components/PlayerBar';
import { data } from '../../data';
// Главная страница приложения - собирает все компоненты вместе
export default function Home() {
  const dispatch = useAppDispatch();
  const currentTrack = useAppSelector((state) => state.track.currentTrack);
  const isPlaying = useAppSelector((state) => state.track.isPlaying);
  const playlist = useAppSelector((state) => state.track.playlist);
  // Локальные состояния компонента
  const [isShuffled, setIsShuffled] = useState(false); // включен ли режим перемешивания
  const [playedTracks, setPlayedTracks] = useState<number[]>([]); // массив ID треков которые уже проиграли в shuffle режиме
  const [likedTracks, setLikedTracks] = useState<number[]>([]); // массив ID лайкнутых треков
  const [searchQuery, setSearchQuery] = useState(''); // текст поиска

  // При первой загрузке страницы загружаем все треки в плейлист
  useEffect(() => {
    dispatch(setPlaylist(data));
  }, [dispatch]); // dispatch в зависимостях чтобы линтер не ругался

  // Когда меняется поисковый запрос, фильтруем треки
  useEffect(() => {
    const filtered = searchQuery
      ? data.filter(
          (track) =>
            // ищем по названию, исполнителю или альбому (без учета регистра)
            track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            track.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
            track.album.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : data; // если поиск пустой, показываем все треки
    dispatch(setPlaylist(filtered));
  }, [searchQuery, dispatch]);

  // Обработчик клика на трек в списке
  const handleTrackSelect = (track: Track) => {
    // Если кликнули на тот же трек что уже играет - просто пауза/плей
    if (currentTrack?._id === track._id) {
      dispatch(togglePlayPause());
    } else {
      // Иначе выбираем новый трек и сразу начинаем играть
      dispatch(setCurrentTrack(track));
      dispatch(setIsPlaying(true));
      // В shuffle режиме сбрасываем список воспроизведенных, начинаем заново
      if (isShuffled) {
        setPlayedTracks([track._id]); // оставляем только текущий трек
      }
    }
  };

  const handlePlayPause = () => {
    if (currentTrack) {
      dispatch(togglePlayPause());
    }
  };

  // Функция для получения следующего трека
  const getNextTrack = (): Track | null => {
    if (!currentTrack) return null; // если нет текущего трека, ничего не возвращаем

    if (isShuffled) {
      // В режиме перемешивания выбираем случайный трек
      // Сначала находим все треки которые еще не играли
      const unplayedTracks = playlist.filter(
        (track) => !playedTracks.includes(track._id),
      );

      // Если все треки уже проиграли, сбрасываем список и выбираем из всех кроме текущего
      if (unplayedTracks.length === 0) {
        setPlayedTracks([currentTrack._id]); // начинаем заново
        const availableTracks = playlist.filter(
          (track) => track._id !== currentTrack._id, // исключаем текущий трек
        );
        if (availableTracks.length === 0) return null; // если больше нет треков
        // Выбираем случайный из доступных
        const randomTrack =
          availableTracks[Math.floor(Math.random() * availableTracks.length)];
        return randomTrack;
      }

      // Выбираем случайный трек из тех что еще не играли
      const randomTrack =
        unplayedTracks[Math.floor(Math.random() * unplayedTracks.length)];
      return randomTrack;
    } else {
      // Обычный режим - просто следующий трек по порядку
      const currentIndex = playlist.findIndex(
        (track) => track._id === currentTrack._id,
      );
      if (currentIndex !== -1) {
        // Если это последний трек в списке, не переключаем (возвращаем null)
        if (currentIndex === playlist.length - 1) {
          return null;
        }
        // Иначе берем следующий по индексу
        const nextIndex = currentIndex + 1;
        return playlist[nextIndex];
      }
    }
    return null; // на всякий случай
  };

  // Функция для получения предыдущего трека
  const getPrevTrack = (): Track | null => {
    if (!currentTrack) return null;

    // Находим индекс текущего трека в плейлисте
    const currentIndex = playlist.findIndex(
      (track) => track._id === currentTrack._id,
    );
    if (currentIndex !== -1) {
      // Если это первый трек, не переключаем
      if (currentIndex === 0) {
        return null;
      }
      // Берем предыдущий по индексу
      const prevIndex = currentIndex - 1;
      return playlist[prevIndex];
    }
    return null;
  };

  // Обработчик кнопки "следующий трек"
  const handleNextTrack = () => {
    if (!currentTrack) return; // если нет трека, ничего не делаем

    const nextTrack = getNextTrack();
    if (nextTrack) {
      // В shuffle режиме добавляем текущий трек в список воспроизведенных
      if (isShuffled) {
        setPlayedTracks((prev) => [...prev, currentTrack._id]); // добавляем в конец массива
      }
      // Переключаемся на следующий трек и начинаем играть
      dispatch(setCurrentTrack(nextTrack));
      dispatch(setIsPlaying(true));
    }
    // Если nextTrack null, ничего не происходит (например, последний трек)
  };

  // Обработчик кнопки "предыдущий трек"
  const handlePrevTrack = () => {
    if (!currentTrack) return;

    const prevTrack = getPrevTrack();
    if (prevTrack) {
      // Переключаемся на предыдущий трек и начинаем играть
      dispatch(setCurrentTrack(prevTrack));
      dispatch(setIsPlaying(true));
    }
  };

  // Переключение режима перемешивания
  const handleToggleShuffle = () => {
    setIsShuffled(!isShuffled); // меняем состояние на противоположное
    // При переключении режима сбрасываем список воспроизведенных треков
    if (currentTrack) {
      setPlayedTracks([currentTrack._id]); // оставляем только текущий
    } else {
      setPlayedTracks([]); // если нет трека, список пустой
    }
  };

  // Переключение лайка на треке
  const handleToggleLike = (trackId: number) => {
    setLikedTracks((prev) => {
      // Если трек уже лайкнут - убираем из списка
      if (prev.includes(trackId)) {
        return prev.filter((id) => id !== trackId); // фильтруем массив, убираем этот id
      } else {
        // Если не лайкнут - добавляем
        return [...prev, trackId]; // создаем новый массив с добавленным id
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
            <Filter />
            <Playlist
              tracks={playlist}
              likedTracks={likedTracks}
              onTrackSelect={handleTrackSelect}
              onToggleLike={handleToggleLike}
            />
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
