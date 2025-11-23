'use client';

// Импортируем стили для главной страницы
import styles from './page.module.css';
// Импортируем все компоненты, из которых состоит главная страница
// @ - это алиас для папки src, настроен в tsconfig.json
import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Search from '@/components/Search';
import Filter from '@/components/Filter';
import Playlist from '@/components/Playlist';
import Sidebar from '@/components/Sidebar';
import PlayerBar from '@/components/PlayerBar';
import { data } from '../../data';

// Главная страница приложения - собирает все компоненты вместе
export default function Home() {
  const [currentTrack, setCurrentTrack] = useState<typeof data[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [playedTracks, setPlayedTracks] = useState<number[]>([]); // Для отслеживания воспроизведенных треков в режиме shuffle

  const handleTrackSelect = (track: typeof data[0]) => {
    if (currentTrack?._id === track._id) {
      // Если выбран тот же трек, переключаем воспроизведение
      setIsPlaying(!isPlaying);
    } else {
      // Выбираем новый трек и начинаем воспроизведение
      setCurrentTrack(track);
      setIsPlaying(true);
      // При ручном выборе трека обновляем список воспроизведенных (для shuffle)
      if (isShuffled) {
        setPlayedTracks([track._id]);
      }
    }
  };

  const handlePlayPause = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
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
      setCurrentTrack(nextTrack);
      setIsPlaying(true);
    }
  };

  const handlePrevTrack = () => {
    if (!currentTrack) return;
    
    const prevTrack = getPrevTrack();
    if (prevTrack) {
      setCurrentTrack(prevTrack);
      setIsPlaying(true);
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

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <main className={styles.main}>
          {/* Левая навигационная панель с меню */}
          <Navigation />
          
          {/* Центральный блок с поиском, фильтрами и списком треков */}
          <div className={styles.centerblock}>
            <Search />
            <h2 className={styles.h2}>Треки</h2>
            <Filter />
            <Playlist 
              tracks={data}
              currentTrackId={currentTrack?._id || null}
              onTrackSelect={handleTrackSelect}
            />
          </div>
          
          {/* Правая боковая панель с плейлистами */}
          <Sidebar />
        </main>
        
        {/* Плеер внизу страницы - фиксированная позиция */}
        <PlayerBar 
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNextTrack={handleNextTrack}
          onPrevTrack={handlePrevTrack}
          isShuffled={isShuffled}
          onToggleShuffle={handleToggleShuffle}
        />
        <footer className={styles.footer}></footer>
      </div>
    </div>
  );
}
