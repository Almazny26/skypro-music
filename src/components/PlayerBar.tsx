'use client';

import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import styles from './PlayerBar.module.css';

// Интерфейс для пропсов компонента PlayerBar
interface PlayerBarProps {
  isLiked: boolean;
  isShuffled: boolean;
  onPlayPause: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onToggleShuffle: () => void;
  onToggleLike: () => void;
}

// Компонент плеера - фиксированная панель внизу страницы
export default function PlayerBar({ isLiked, isShuffled, onPlayPause, onNextTrack, onPrevTrack, onToggleShuffle, onToggleLike }: PlayerBarProps) {
  const currentTrack = useAppSelector((state) => state.track.currentTrack);
  const isPlaying = useAppSelector((state) => state.track.isPlaying);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);

  // Обновление источника аудио при смене трека
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack) {
      // Сначала останавливаем текущее воспроизведение
      audio.pause();
      audio.src = currentTrack.track_file;
      audio.load(); // Загружаем новый источник
      setCurrentTime(0);
    }
  }, [currentTrack]);

  // Управление воспроизведением через audio элемент (только для play/pause, не при смене трека)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Если трек только что загрузился, не пытаемся воспроизвести сразу
    // Воспроизведение начнется через событие canplay
    if (isPlaying) {
      // Проверяем, готов ли аудио к воспроизведению
      if (audio.readyState >= 2) { // HAVE_CURRENT_DATA или выше
        audio.play().catch((error) => {
          console.error('Ошибка воспроизведения:', error);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Управление зацикливанием через свойство loop аудиоэлемента
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = isLooping;
  }, [isLooping]);

  // Обработчик обновления времени воспроизведения и загрузки
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    // Обработчик готовности к воспроизведению
    const handleCanPlay = () => {
      // Если трек должен играть и источник готов, начинаем воспроизведение
      if (isPlaying && currentTrack) {
        audio.play().catch((error) => {
          // Игнорируем ошибку, если воспроизведение было прервано загрузкой
          if (error.name !== 'AbortError') {
            console.error('Ошибка воспроизведения:', error);
          }
        });
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentTrack, isPlaying]);

  // Обработчик окончания трека
  const handleEnded = () => {
    // Если зацикливание выключено, переключаем на следующий трек
    if (!isLooping) {
      onNextTrack();
    }
  };

  // Обработчик переключения зацикливания
  const handleToggleLoop = () => {
    setIsLooping(!isLooping);
  };

  // Обработчик изменения прогресса (перемотка)
  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Вычисление процента прогресса
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.bar}>
      {/* Скрытый audio элемент для управления воспроизведением */}
      <audio
        ref={audioRef}
        onEnded={handleEnded}
        style={{ display: 'none' }}
      />
      
      <div className={styles.content}>
        {/* Полоса прогресса воспроизведения */}
        <div 
          className={styles.playerProgress}
          onClick={handleProgressChange}
          style={{ cursor: currentTrack ? 'pointer' : 'default' }}
        >
          <div 
            className={styles.playerProgressBar}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        <div className={styles.playerBlock}>
          <div className={styles.player}>
            {/* Блок с кнопками управления плеером */}
            <div className={styles.controls}>
              {/* Кнопка "Предыдущий трек" */}
              <div 
                className={`${styles.btnPrev} ${styles.btn}`}
                onClick={currentTrack ? onPrevTrack : undefined}
                style={{ cursor: currentTrack ? 'pointer' : 'default', opacity: currentTrack ? 1 : 0.5 }}
              >
                <svg className={styles.btnPrevSvg}>
                  <use href="/img/icon/sprite.svg#icon-prev"></use>
                </svg>
              </div>
              
              {/* Кнопка "Play/Pause" - основная кнопка управления */}
              <div 
                className={`${styles.btnPlay} ${styles.btn} ${styles.btnIcon} ${isPlaying ? styles.active : ''}`}
                onClick={currentTrack ? onPlayPause : undefined}
                style={{ cursor: currentTrack ? 'pointer' : 'default', opacity: currentTrack ? 1 : 0.5 }}
              >
                <svg className={styles.btnPlaySvg}>
                  <use href={`/img/icon/sprite.svg#icon-${isPlaying ? 'pause' : 'play'}`}></use>
                </svg>
              </div>
              
              {/* Кнопка "Следующий трек" */}
              <div 
                className={`${styles.btnNext} ${styles.btn}`}
                onClick={currentTrack ? onNextTrack : undefined}
                style={{ cursor: currentTrack ? 'pointer' : 'default', opacity: currentTrack ? 1 : 0.5 }}
              >
                <svg className={styles.btnNextSvg}>
                  <use href="/img/icon/sprite.svg#icon-next"></use>
                </svg>
              </div>
              
              {/* Кнопка "Повтор" */}
              <div 
                className={`${styles.btnRepeat} ${styles.btnIcon} ${styles.btn} ${isLooping ? styles.active : ''}`}
                onClick={handleToggleLoop}
                style={{ cursor: 'pointer' }}
              >
                <svg className={styles.btnRepeatSvg}>
                  <use href="/img/icon/sprite.svg#icon-repeat"></use>
                </svg>
              </div>
              
              {/* Кнопка "Перемешать" */}
              <div 
                className={`${styles.btnShuffle} ${styles.btnIcon} ${styles.btn} ${isShuffled ? styles.active : ''}`}
                onClick={onToggleShuffle}
                style={{ cursor: 'pointer' }}
              >
                <svg className={styles.btnShuffleSvg}>
                  <use href="/img/icon/sprite.svg#icon-shuffle"></use>
                </svg>
              </div>
            </div>

            {/* Блок с информацией о текущем треке */}
            <div className={styles.trackPlay}>
              <div className={styles.contain}>
                {/* Иконка текущего трека */}
                <div className={styles.image}>
                  <svg className={styles.svg}>
                    <use href="/img/icon/sprite.svg#icon-note"></use>
                  </svg>
                </div>
                
                {/* Название текущего трека */}
                <div className={styles.author}>
                  <Link className={styles.authorLink} href="">
                    {currentTrack?.name || 'Ты та...'}
                  </Link>
                </div>
                
                {/* Исполнитель текущего трека */}
                <div className={styles.album}>
                  <Link className={styles.albumLink} href="">
                    {currentTrack?.author || 'Баста'}
                  </Link>
                </div>
              </div>

              {/* Кнопки лайка и дизлайка */}
              <div className={styles.dislike}>
                <div 
                  className={`${styles.btnShuffle} ${styles.btnIcon} ${styles.btn}`}
                  onClick={onToggleLike}
                  style={{ cursor: 'pointer' }}
                >
                  <svg className={`${styles.likeSvg} ${isLiked ? styles.likeSvgLiked : ''}`}>
                    <use href="/img/icon/sprite.svg#icon-like"></use>
                  </svg>
                </div>
                <div 
                  className={`${styles.dislikeBtn} ${styles.btnIcon} ${styles.btn}`}
                  onClick={() => alert('Еще не реализовано')}
                  style={{ cursor: 'pointer' }}
                >
                  <svg className={styles.dislikeSvg}>
                    <use href="/img/icon/sprite.svg#icon-dislike"></use>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Блок управления громкостью */}
          <div className={styles.volumeBlock}>
            <div className={styles.volumeContent}>
              {/* Иконка громкости */}
              <div className={styles.volumeImage}>
                <svg className={styles.volumeSvg}>
                  <use href="/img/icon/sprite.svg#icon-volume"></use>
                </svg>
              </div>
              
              {/* Ползунок громкости */}
              <div className={`${styles.volumeProgress} ${styles.btn}`}>
                <input
                  className={`${styles.volumeProgressLine} ${styles.btn}`}
                  type="range"
                  name="range"
                  min="0"
                  max="100"
                  defaultValue="50"
                  onChange={(e) => {
                    if (audioRef.current) {
                      audioRef.current.volume = Number(e.target.value) / 100;
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


