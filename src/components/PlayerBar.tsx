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

// Плеер внизу страницы - управляет воспроизведением аудио
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
  
  // Использую ref для прямого доступа к audio элементу
  const audioRef = useRef<HTMLAudioElement>(null);
  // Локальное состояние для времени - дублирую в Redux, чтобы другие компоненты могли использовать
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false); // Режим повтора трека
  // Храню время последнего клика на "назад" - если кликнуть дважды быстро, перематываю на предыдущий трек
  const lastPrevClickTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Флаг для отслеживания состояния воспроизведения - помогает избежать конфликтов
  const isPlayingRef = useRef<boolean>(false);

  // Когда меняется текущий трек, загружаю новый аудио файл
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack) {
      // Проверяю, не тот ли это уже трек - чтобы не перезагружать без необходимости
      const currentSrc = audio.src || '';
      const trackUrl = currentTrack.track_file;
      // Сравниваю URL - они могут быть в разных форматах
      if (currentSrc && (currentSrc === trackUrl || currentSrc.endsWith(trackUrl) || trackUrl.endsWith(currentSrc)) && currentSrc !== window.location.href) {
        return; // Трек уже загружен, ничего не делаю
      }

      // Останавливаю текущее воспроизведение
      audio.pause();
      // Сбрасываю время перед загрузкой нового трека
      setCurrentTime(0);
      dispatch(setCurrentTimeAction(0));
      setDuration(0);
      dispatch(setDurationAction(0));
      // Устанавливаю новый источник
      audio.src = currentTrack.track_file;
      audio.preload = 'auto';
      // Сбрасываю таймер для кнопки "назад"
      lastPrevClickTime.current = 0;
      audio.load();
    } else {
      // Если трек не выбран, очищаю источник
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      setCurrentTime(0);
      dispatch(setCurrentTimeAction(0));
      setDuration(0);
      dispatch(setDurationAction(0));
      isPlayingRef.current = false;
    }
  }, [currentTrack, dispatch]);

  // Управляю play/pause в зависимости от состояния isPlaying из Redux
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = isPlaying;

    if (isPlaying) {
      // Если уже играет, ничего не делаю
      if (!audio.paused && audio.readyState >= 2) {
        return;
      }

      // Функция для попытки запуска воспроизведения
      const tryPlay = () => {
        // Проверяю, что трек все еще актуален
        if (!isPlayingRef.current || !currentTrack) return;
        
        // Проверяю, что источник совпадает с текущим треком
        const currentSrc = audio.src || '';
        const trackUrl = currentTrack.track_file;
        const srcMatches = currentSrc === trackUrl || currentSrc.endsWith(trackUrl) || trackUrl.endsWith(currentSrc);
        if (!srcMatches) return;
        
        // readyState >= 2 означает, что есть достаточно данных для воспроизведения
        if (audio.readyState >= 2) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                isPlayingRef.current = true;
              })
              .catch((error) => {
                // AbortError - это нормально при быстром переключении треков
                if (error.name !== 'AbortError' && process.env.NODE_ENV === 'development') {
                  console.error('Ошибка воспроизведения:', error);
                }
                isPlayingRef.current = false;
              });
          }
        }
      };

      // Пытаюсь запустить сразу, если аудио уже готово
      tryPlay();
      
      // Если еще не готово, подписываемся на canplay
      const handleCanPlayForPlay = () => {
        tryPlay();
        audio.removeEventListener('canplay', handleCanPlayForPlay);
      };
      
      if (audio.readyState < 2) {
        audio.addEventListener('canplay', handleCanPlayForPlay);
      }
      
      return () => {
        audio.removeEventListener('canplay', handleCanPlayForPlay);
      };
    } else {
      // Если isPlaying false - ставим на паузу
      if (!audio.paused) {
        audio.pause();
      }
      isPlayingRef.current = false;
    }
  }, [isPlaying, currentTrack]);

  // Включаем/выключаем зацикливание трека
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = isLooping; // просто устанавливаем свойство loop
  }, [isLooping]);

  // Настраиваем обработчики событий для audio элемента
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Обновляем время каждую секунду (примерно)
    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time); // обновляем локальное состояние
      dispatch(setCurrentTimeAction(time)); // и в Redux для других компонентов
    };

    // Когда загрузились метаданные (длительность трека)
    const handleLoadedMetadata = () => {
      const dur = audio.duration;
      if (isFinite(dur) && !isNaN(dur) && dur > 0) {
        setDuration(dur);
        dispatch(setDurationAction(dur));
      }
    };

    // Когда аудио готово к воспроизведению
    const handleCanPlay = () => {
      // Проверяем, что трек все еще текущий
      if (!currentTrack) return;
      
      // Нормализуем URL для сравнения
      const currentSrc = audio.src || '';
      const trackUrl = currentTrack.track_file;
      const srcMatches = currentSrc === trackUrl || currentSrc.endsWith(trackUrl) || trackUrl.endsWith(currentSrc);
      
      if (!srcMatches) return; // Это не наш трек
      
      // Если трек должен играть и аудио готово, начинаем воспроизведение
      // Используем isPlayingRef.current для актуального значения
      if (isPlayingRef.current && audio.readyState >= 2 && audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              isPlayingRef.current = true;
            })
            .catch((error) => {
              // AbortError можно игнорировать - это когда загрузка прервалась
              if (
                error.name !== 'AbortError' &&
                process.env.NODE_ENV === 'development'
              ) {
                console.error('Ошибка воспроизведения в canplay:', error);
              }
              isPlayingRef.current = false;
            });
        }
      }
    };

    // Обработка ошибок загрузки
    const handleError = (e: Event) => {
      const audio = e.target as HTMLAudioElement;
      if (audio.error) {
        // Коды ошибок:
        // 1 = MEDIA_ERR_ABORTED - загрузка прервана
        // 2 = MEDIA_ERR_NETWORK - ошибка сети
        // 3 = MEDIA_ERR_DECODE - ошибка декодирования
        // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED - формат не поддерживается
        const errorMessages = {
          1: 'Загрузка прервана',
          2: 'Ошибка сети. Проверьте подключение к интернету',
          3: 'Ошибка декодирования аудио',
          4: 'Формат аудио не поддерживается',
        };
        const errorCode = audio.error.code;
        const errorMessage = errorMessages[errorCode as keyof typeof errorMessages] || 'Неизвестная ошибка';
        
        if (process.env.NODE_ENV === 'development') {
          console.error('Ошибка загрузки аудио:', {
            code: errorCode,
            message: errorMessage,
            src: audio.src,
            error: audio.error,
          });
        }
        
        // Если произошла ошибка, сбрасываем состояние воспроизведения
        dispatch(setIsPlaying(false));
        isPlayingRef.current = false;
        
        // Показываем предупреждение только для критических ошибок (не для прерванной загрузки)
        if (errorCode !== 1 && process.env.NODE_ENV === 'development') {
          console.warn(`Не удалось загрузить трек: ${errorMessage}`);
        }
      }
    };

    // Обработчик события pause - НЕ используем, чтобы избежать конфликтов
    // Мы управляем паузой через isPlaying в Redux
    
    // Обработчик события play - обновляем ref когда аудио начинает играть
    const handlePlay = () => {
      if (!audio.paused) {
        isPlayingRef.current = true;
      }
    };

    // Обработчик события waiting - когда трек останавливается из-за нехватки данных
    const handleWaiting = () => {
      // Если трек должен играть, но остановился из-за нехватки данных,
      // ждем когда данные загрузятся и продолжаем
      if (isPlayingRef.current) {
        const handleCanPlayAfterWaiting = () => {
          if (isPlayingRef.current && audio.paused && audio.readyState >= 2) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch((error) => {
                if (error.name !== 'AbortError' && process.env.NODE_ENV === 'development') {
                  console.error('Ошибка воспроизведения после waiting:', error);
                }
              });
            }
          }
          audio.removeEventListener('canplay', handleCanPlayAfterWaiting);
        };
        audio.addEventListener('canplay', handleCanPlayAfterWaiting);
      }
    };

    // Подписываемся на события
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('waiting', handleWaiting);

    // Cleanup - обязательно удаляем обработчики при размонтировании
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('waiting', handleWaiting);
    };
  }, [currentTrack, isPlaying, dispatch]);

  // Когда трек закончился
  const handleEnded = () => {
    // Если режим повтора выключен, переключаемся на следующий трек
    if (!isLooping) {
      onNextTrack();
    }
    // Иначе трек зациклится сам (через свойство loop)
  };

  // Переключаем режим повтора
  const handleToggleLoop = () => {
    setIsLooping(!isLooping);
  };

  // Обработчик клика на прогресс-бар для перемотки
  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Получаем координаты клика относительно прогресс-бара
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left; // расстояние от левого края
    const percentage = clickX / rect.width; // процент от общей ширины
    const newTime = percentage * duration; // вычисляем новое время

    // Устанавливаем новое время
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    dispatch(setCurrentTimeAction(newTime));
  };

  // Логика кнопки "назад" - как в обычных плеерах
  // Первый клик - перематывает в начало, второй клик (если быстро) - предыдущий трек
  const handlePrevTrack = () => {
    if (!currentTrack) return;

    const audio = audioRef.current;
    const now = Date.now(); // текущее время в миллисекундах
    const timeSinceLastClick = now - lastPrevClickTime.current;
    const REWIND_THRESHOLD = 3000; // 3 секунды - порог для определения "быстрого" клика

    // Если трек в начале (меньше 3 сек) или кликнули быстро второй раз - переключаем трек
    if (
      currentTime < 3 ||
      (timeSinceLastClick < REWIND_THRESHOLD && lastPrevClickTime.current > 0)
    ) {
      lastPrevClickTime.current = 0; // сбрасываем таймер
      onPrevTrack(); // вызываем функцию переключения из пропсов
    } else {
      // Иначе просто перематываем текущий трек в начало
      if (audio) {
        audio.currentTime = 0;
        setCurrentTime(0);
        dispatch(setCurrentTimeAction(0));
      }
      lastPrevClickTime.current = now; // запоминаем время клика

      // Очищаем предыдущий таймер если был
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Через 3 секунды сбрасываем таймер (чтобы следующий клик считался первым)
      timeoutRef.current = setTimeout(() => {
        lastPrevClickTime.current = 0;
        timeoutRef.current = null;
      }, REWIND_THRESHOLD);
    }
  };

  // Очищаем таймер когда компонент размонтируется (чтобы не было утечек памяти)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // пустой массив зависимостей = выполнится только при размонтировании

  // Вычисляем процент прогресса для отображения полосы
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Форматируем секунды в читаемый формат MM:SS
  const formatTime = (seconds: number): string => {
    // Проверяем что число валидное
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
    // Округляем до целых секунд
    const roundedSeconds = Math.floor(seconds);
    const mins = Math.floor(roundedSeconds / 60);
    const secs = roundedSeconds % 60;
    // padStart добавляет ноль в начале если секунд меньше 10
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.bar}>
      {/* Скрытый audio элемент для управления воспроизведением */}
      <audio ref={audioRef} onEnded={handleEnded} style={{ display: 'none' }} />

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

              {/* Кнопка "Play/Pause" - основная кнопка управления */}
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

              {/* Кнопка "Следующий трек" */}
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

              {/* Кнопка "Повтор" */}
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

              {/* Кнопка "Перемешать" */}
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
                  <span className={styles.authorLink}>
                    {currentTrack?.name || 'Ты та...'}
                  </span>
                </div>

                {/* Исполнитель текущего трека */}
                <div className={styles.album}>
                  <span className={styles.albumLink}>
                    {currentTrack?.author || 'Баста'}
                  </span>
                </div>
              </div>

              {/* Кнопки лайка и дизлайка */}
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

          {/* Блок управления громкостью */}
          <div className={styles.volumeBlock}>
            <div className={styles.volumeContent}>
              {/* Отображение времени проигрывания */}
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
