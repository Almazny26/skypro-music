'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import styles from './Playlist.module.css';
import Track from './Track';

// Преобразую секунды в формат MM:SS для отображения
function formatDuration(seconds: number): string {
  // Проверяю на валидность, чтобы не было NaN или отрицательных значений
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
  const roundedSeconds = Math.floor(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;
  // padStart добавляет ноль в начале, если секунд меньше 10
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

interface PlaylistProps {
  tracks: Array<{
    _id: number;
    name: string;
    author: string;
    album: string;
    duration_in_seconds: number;
    track_file: string;
  }>;
  likedTracks: number[];
  onTrackSelect: (track: PlaylistProps['tracks'][0]) => void;
  onToggleLike: (trackId: number) => void;
}

// Компонент списка треков - отображает таблицу с заголовками и список треков
export default function Playlist({
  tracks,
  likedTracks,
  onTrackSelect,
  onToggleLike,
}: PlaylistProps) {
  // Получаю данные о текущем треке из Redux store
  const currentTrack = useAppSelector((state) => state.track.currentTrack);
  const isPlaying = useAppSelector((state) => state.track.isPlaying);
  const currentTime = useAppSelector((state) => state.track.currentTime);
  const duration = useAppSelector((state) => state.track.duration);
  const currentTrackId = currentTrack?._id || null;

  // Храню реальные длительности треков, которые получаю из метаданных аудио файлов
  // Использую Map для быстрого поиска по ID трека
  const [trackDurations, setTrackDurations] = useState<Map<number, number>>(
    new Map(),
  );

  // Загружаю реальную длительность каждого трека из аудио файлов
  // Делаю это, потому что в данных от API может быть неверная длительность
  useEffect(() => {
    let cancelled = false; // Флаг для отмены, если компонент размонтировался
    const audioElements: HTMLAudioElement[] = []; // Сохраняю все audio элементы для cleanup

    const loadDurations = async () => {
      const durations = new Map<number, number>();

      // Для каждого трека создаю Promise, который загрузит метаданные (длительность)
      const promises = tracks.map((track) => {
        return new Promise<void>((resolve) => {
          // Если компонент уже размонтирован, сразу выхожу
          if (cancelled) {
            resolve();
            return;
          }

          // Создаю audio элемент только для получения метаданных
          const audio = new Audio();
          audioElements.push(audio); // Сохраняю для последующей очистки

          // Когда метаданные загрузились, получаю длительность
          const handleLoadedMetadata = () => {
            // Проверяю валидность данных и что загрузка не отменена
            if (
              !cancelled &&
              isFinite(audio.duration) &&
              !isNaN(audio.duration) &&
              audio.duration > 0
            ) {
              durations.set(track._id, audio.duration);
            }
            // Удаляю обработчики, чтобы не было утечек памяти
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('error', handleError);
            resolve();
          };

          // Если не удалось загрузить - использую длительность из данных API
          const handleError = () => {
            if (!cancelled) {
              durations.set(track._id, track.duration_in_seconds);
            }
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('error', handleError);
            resolve();
          };

          // Подписываюсь на события
          audio.addEventListener('loadedmetadata', handleLoadedMetadata);
          audio.addEventListener('error', handleError);

          // preload='metadata' загружает только метаданные, не весь файл - экономит трафик
          audio.preload = 'metadata';
          audio.src = track.track_file; // Начинаю загрузку
        });
      });

      // Жду, пока все треки загрузят метаданные
      await Promise.all(promises);

      // Если компонент еще не размонтирован, обновляю состояние
      if (!cancelled) {
        setTrackDurations(durations);
      }
    };

    loadDurations();

    // Cleanup - отменяю загрузку при размонтировании или изменении списка треков
    return () => {
      cancelled = true;
      // Останавливаю загрузку всех audio элементов
      audioElements.forEach((audio) => {
        audio.src = ''; // Очищаю источник
        audio.load(); // Это останавливает загрузку
      });
    };
  }, [tracks]);
  return (
    <div className={styles.content}>
      {/* Заголовки колонок таблицы треков */}
      <div className={styles.title}>
        <div className={styles.col01}>Трек</div>
        <div className={styles.col02}>Исполнитель</div>
        <div className={styles.col03}>Альбом</div>
        <div className={styles.col04}>
          {/* Иконка часов для колонки с длительностью */}
          <svg className={styles.titleSvg}>
            <use href="/img/icon/sprite.svg#icon-watch"></use>
          </svg>
        </div>
      </div>

      {/* Список треков - рендерю каждый трек как отдельный компонент */}
      <div className={styles.playlist}>
        {tracks.map((track) => {
          // Проверяю, является ли этот трек текущим (играющим)
          const isActive = currentTrackId === track._id;
          let displayDuration: string;

          // Для активного трека показываю оставшееся время (обратный отсчет)
          if (isActive && duration > 0) {
            const remainingTime = Math.max(0, duration - currentTime); // Math.max чтобы не было отрицательных значений
            displayDuration = formatDuration(remainingTime);
          } else {
            // Для остальных треков показываю общую длительность
            // Сначала пытаюсь взять реальную длительность из метаданных аудио
            const realDuration = trackDurations.get(track._id);
            // Если есть реальная длительность - использую её, иначе беру из данных API
            const trackDuration =
              realDuration !== undefined
                ? realDuration
                : track.duration_in_seconds;
            displayDuration = formatDuration(trackDuration);
          }

          return (
            <Track
              key={track._id}
              track={track}
              duration={displayDuration}
              isActive={isActive}
              isPlaying={isActive && isPlaying}
              isLiked={likedTracks.includes(track._id)}
              onSelect={onTrackSelect}
              onToggleLike={() => onToggleLike(track._id)}
            />
          );
        })}
      </div>
    </div>
  );
}
