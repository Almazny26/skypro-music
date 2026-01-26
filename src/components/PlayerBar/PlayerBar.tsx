'use client';

import { useRef, useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  setCurrentTime as setCurrentTimeAction,
  setDuration as setDurationAction,
  setIsPlaying,
} from '@/store/trackSlice';
import styles from './PlayerBar.module.css';

interface PlayerBarProps {
  isLiked: boolean;
  isShuffled: boolean;
  onPlayPause: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onToggleShuffle: () => void;
  onToggleLike: () => void;
}

export default function PlayerBar({
  isLiked,
  isShuffled,
  onPlayPause,
  onNextTrack,
  onPrevTrack,
  onToggleShuffle,
  onToggleLike,
}: PlayerBarProps) {
  const dispatch = useAppDispatch();
  const currentTrack = useAppSelector((state) => state.track.currentTrack);
  const isPlaying = useAppSelector((state) => state.track.isPlaying);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const lastPrevClickTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadedTrackIdRef = useRef<number | null>(null);

  // Загрузка трека при его изменении
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Если нет трека - сбрасываем всё
    if (!currentTrack) {
      loadedTrackIdRef.current = null;
      audio.pause();
      audio.removeAttribute('src');
      setCurrentTime(0);
      dispatch(setCurrentTimeAction(0));
      setDuration(0);
      dispatch(setDurationAction(0));
      return;
    }

    // Загружаем новый трек если он изменился
    if (loadedTrackIdRef.current !== currentTrack._id) {
      loadedTrackIdRef.current = currentTrack._id;
      
      audio.pause();
      setCurrentTime(0);
      dispatch(setCurrentTimeAction(0));
      setDuration(0);
      dispatch(setDurationAction(0));

      audio.src = currentTrack.track_file;
      audio.load();
    }
  }, [currentTrack, dispatch]);

  // Управление воспроизведением
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      // Функция запуска воспроизведения
      const startPlayback = () => {
        if (audio.paused && audio.src) {
          audio.play().catch((err) => {
            console.error('Play failed:', err);
            dispatch(setIsPlaying(false));
          });
        }
      };

      // Если аудио готово - запускаем сразу
      if (audio.readyState >= 2) {
        startPlayback();
      }

      // Слушаем canplay на случай если ещё не готово
      const onCanPlay = () => {
        if (isPlaying && audio.paused) {
          startPlayback();
        }
      };
      audio.addEventListener('canplay', onCanPlay);
      
      return () => {
        audio.removeEventListener('canplay', onCanPlay);
      };
    } else {
      // Пауза
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [currentTrack, isPlaying, dispatch]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = isLooping;
  }, [isLooping]);

  // Обработчики событий аудио
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      dispatch(setCurrentTimeAction(audio.currentTime));
    };

    const handleLoadedMetadata = () => {
      const dur = audio.duration;
      if (isFinite(dur) && !isNaN(dur) && dur > 0) {
        setDuration(dur);
        dispatch(setDurationAction(dur));
      }
    };

    const handleError = () => {
      if (audio.error) {
        console.error('Audio error:', audio.error.code, audio.error.message);
        dispatch(setIsPlaying(false));
      }
    };

    const handleEnded = () => {
      dispatch(setIsPlaying(false));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [dispatch]);

  const handleEnded = () => {
    if (!isLooping) {
      onNextTrack();
    }
  };

  const handleToggleLoop = () => {
    setIsLooping(!isLooping);
  };

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
    dispatch(setCurrentTimeAction(newTime));
  };

  const handlePrevTrack = () => {
    if (!currentTrack) return;

    const audio = audioRef.current;
    const now = Date.now();
    const timeSinceLastClick = now - lastPrevClickTime.current;
    const REWIND_THRESHOLD = 3000;

    if (
      currentTime < 3 ||
      (timeSinceLastClick < REWIND_THRESHOLD && lastPrevClickTime.current > 0)
    ) {
      lastPrevClickTime.current = 0;
      onPrevTrack();
    } else {
      if (audio) {
        audio.currentTime = 0;
        setCurrentTime(0);
        dispatch(setCurrentTimeAction(0));
      }
      lastPrevClickTime.current = now;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        lastPrevClickTime.current = 0;
        timeoutRef.current = null;
      }, REWIND_THRESHOLD);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
    const roundedSeconds = Math.floor(seconds);
    const mins = Math.floor(roundedSeconds / 60);
    const secs = roundedSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.bar}>
      <audio ref={audioRef} onEnded={handleEnded} style={{ display: 'none' }} />

      <div className={styles.content}>
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
            <div className={styles.controls}>
              <div
                className={`${styles.btnPrev} ${styles.btn}`}
                onClick={currentTrack ? handlePrevTrack : undefined}
                style={{
                  cursor: currentTrack ? 'pointer' : 'default',
                  opacity: currentTrack ? 1 : 0.5,
                }}
              >
                <svg className={styles.btnPrevSvg}>
                  <use href="/img/icon/sprite.svg#icon-prev"></use>
                </svg>
              </div>

              <div
                className={`${styles.btnPlay} ${styles.btn} ${styles.btnIcon} ${
                  isPlaying ? styles.active : ''
                }`}
                onClick={onPlayPause}
                style={{
                  cursor: 'pointer',
                }}
              >
                <svg className={styles.btnPlaySvg}>
                  <use
                    href={`/img/icon/sprite.svg#icon-${
                      isPlaying ? 'pause' : 'play'
                    }`}
                  ></use>
                </svg>
              </div>

              <div
                className={`${styles.btnNext} ${styles.btn}`}
                onClick={currentTrack ? onNextTrack : undefined}
                style={{
                  cursor: currentTrack ? 'pointer' : 'default',
                  opacity: currentTrack ? 1 : 0.5,
                }}
              >
                <svg className={styles.btnNextSvg}>
                  <use href="/img/icon/sprite.svg#icon-next"></use>
                </svg>
              </div>

              <div
                className={`${styles.btnRepeat} ${styles.btnIcon} ${
                  styles.btn
                } ${isLooping ? styles.active : ''}`}
                onClick={handleToggleLoop}
                style={{ cursor: 'pointer' }}
              >
                <svg className={styles.btnRepeatSvg}>
                  <use href="/img/icon/sprite.svg#icon-repeat"></use>
                </svg>
              </div>

              <div
                className={`${styles.btnShuffle} ${styles.btnIcon} ${
                  styles.btn
                } ${isShuffled ? styles.active : ''}`}
                onClick={onToggleShuffle}
                style={{ cursor: 'pointer' }}
              >
                <svg className={styles.btnShuffleSvg}>
                  <use href="/img/icon/sprite.svg#icon-shuffle"></use>
                </svg>
              </div>
            </div>

            <div className={styles.trackPlay}>
              <div className={styles.contain}>
                <div className={styles.image}>
                  <svg className={styles.svg}>
                    <use href="/img/icon/sprite.svg#icon-note"></use>
                  </svg>
                </div>

                <div className={styles.author}>
                  <span className={styles.authorLink}>
                    {currentTrack?.name || 'Ты та...'}
                  </span>
                </div>

                <div className={styles.album}>
                  <span className={styles.albumLink}>
                    {currentTrack?.author || 'Баста'}
                  </span>
                </div>
              </div>

              <div className={styles.dislike}>
                <div
                  className={`${styles.btnShuffle} ${styles.btnIcon} ${styles.btn}`}
                  onClick={onToggleLike}
                  style={{ cursor: 'pointer' }}
                >
                  <svg
                    className={`${styles.likeSvg} ${
                      isLiked ? styles.likeSvgLiked : ''
                    }`}
                  >
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

          <div className={styles.volumeBlock}>
            <div className={styles.volumeContent}>
              <div className={styles.timeContainer}>
                <span className={styles.timeText}>
                  <span className={styles.timeTextPart}>
                    {formatTime(currentTime)}
                  </span>
                  <span className={styles.timeTextSeparator}>/</span>
                  <span className={styles.timeTextPart}>
                    {formatTime(duration)}
                  </span>
                </span>
              </div>

              <div className={styles.volumeImage}>
                <svg className={styles.volumeSvg}>
                  <use href="/img/icon/sprite.svg#icon-volume"></use>
                </svg>
              </div>

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
