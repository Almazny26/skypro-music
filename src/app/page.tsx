'use client';

// Импортируем стили для главной страницы
import styles from './page.module.css';
// Импортируем все компоненты, из которых состоит главная страница
// @ - это алиас для папки src, настроен в tsconfig.json
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCurrentTrack, setIsPlaying, togglePlayPause } from '@/store/trackSlice';
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
  const [isShuffled, setIsShuffled] = useState(false);
  const [playedTracks, setPlayedTracks] = useState<number[]>([]); // Для отслеживания воспроизведенных треков в режиме shuffle
  const [likedTracks, setLikedTracks] = useState<number[]>([]); // Список ID лайкнутых треков
  const [searchQuery, setSearchQuery] = useState(''); // Поисковый запрос

  const handleTrackSelect = (track: typeof data[0]) => {
    if (currentTrack?._id === track._id) {
      // Если выбран тот же трек, переключаем воспроизведение
      dispatch(togglePlayPause());
    } else {
      // Выбираем новый трек и начинаем воспроизведение
      dispatch(setCurrentTrack(track));
      dispatch(setIsPlaying(true));
      // При ручном выборе трека обновляем список воспроизведенных (для shuffle)
      if (isShuffled) {
        setPlayedTracks([track._id]);
      }
    }
  };

  const handlePlayPause = () => {
    if (currentTrack) {
      dispatch(togglePlayPause());
    }
  };

  const getNextTrack = (): typeof data[0] | null => {
    if (!currentTrack) return null;

    if (isShuffled) {
      // Режим перемешивания: выбираем случайный трек, который еще не был воспроизведен
      const unplayedTracks = data.filter(track => !playedTracks.includes(track._id));
      
      // Если все треки были воспроизведены, сбрасываем список
      if (unplayedTracks.length === 0) {
        setPlayedTracks([currentTrack._id]);
        const availableTracks = data.filter(track => track._id !== currentTrack._id);
        if (availableTracks.length === 0) return null;
        const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
        return randomTrack;
      }
      
      // Выбираем случайный трек из невоспроизведенных
      const randomTrack = unplayedTracks[Math.floor(Math.random() * unplayedTracks.length)];
      return randomTrack;
    } else {
      // Обычный режим: следующий трек по порядку
      const currentIndex = data.findIndex(track => track._id === currentTrack._id);
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % data.length;
        return data[nextIndex];
      }
    }
    return null;
  };

  const getPrevTrack = (): typeof data[0] | null => {
    if (!currentTrack) return null;
    
    // Для предыдущего трека всегда используем порядок списка
    const currentIndex = data.findIndex(track => track._id === currentTrack._id);
    if (currentIndex !== -1) {
      const prevIndex = currentIndex === 0 ? data.length - 1 : currentIndex - 1;
      return data[prevIndex];
    }
    return null;
  };

  const handleNextTrack = () => {
    if (!currentTrack) return;
    
    const nextTrack = getNextTrack();
    if (nextTrack) {
      // Добавляем текущий трек в список воспроизведенных (для shuffle)
      if (isShuffled) {
        setPlayedTracks(prev => [...prev, currentTrack._id]);
      }
      dispatch(setCurrentTrack(nextTrack));
      dispatch(setIsPlaying(true));
    }
  };

  const handlePrevTrack = () => {
    if (!currentTrack) return;
    
    const prevTrack = getPrevTrack();
    if (prevTrack) {
      dispatch(setCurrentTrack(prevTrack));
      dispatch(setIsPlaying(true));
    }
  };

  const handleToggleShuffle = () => {
    setIsShuffled(!isShuffled);
    // Сбрасываем список воспроизведенных треков при переключении режима
    if (currentTrack) {
      setPlayedTracks([currentTrack._id]);
    } else {
      setPlayedTracks([]);
    }
  };

  const handleToggleLike = (trackId: number) => {
    setLikedTracks(prev => {
      if (prev.includes(trackId)) {
        // Убираем лайк
        return prev.filter(id => id !== trackId);
      } else {
        // Добавляем лайк
        return [...prev, trackId];
      }
    });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Фильтрация треков по поисковому запросу
  const filteredTracks = searchQuery
    ? data.filter(track => 
        track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.album.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : data;

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
              tracks={filteredTracks}
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
          isLiked={currentTrack ? likedTracks.includes(currentTrack._id) : false}
          isShuffled={isShuffled}
          onPlayPause={handlePlayPause}
          onNextTrack={handleNextTrack}
          onPrevTrack={handlePrevTrack}
          onToggleShuffle={handleToggleShuffle}
          onToggleLike={currentTrack ? () => handleToggleLike(currentTrack._id) : () => {}}
        />
        <footer className={styles.footer}></footer>
      </div>
    </div>
  );
}
