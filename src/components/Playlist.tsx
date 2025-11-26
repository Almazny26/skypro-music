'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import styles from './Playlist.module.css';
import Track from './Track';

// Функция для преобразования секунд в формат MM:SS
function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
  const roundedSeconds = Math.floor(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Интерфейс для пропсов компонента Playlist
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

// Компонент списка треков (плейлиста)
// Содержит заголовки колонок и список компонентов Track
export default function Playlist({
  tracks,
  likedTracks,
  onTrackSelect,
  onToggleLike,
}: PlaylistProps) {
  const currentTrack = useAppSelector((state) => state.track.currentTrack);
  const isPlaying = useAppSelector((state) => state.track.isPlaying);
  const currentTime = useAppSelector((state) => state.track.currentTime);
  const duration = useAppSelector((state) => state.track.duration);
  const currentTrackId = currentTrack?._id || null;

  // Храним реальные длительности треков (получаем из метаданных аудио)
  // Используем Map для быстрого доступа по ID трека
  const [trackDurations, setTrackDurations] = useState<Map<number, number>>(
    new Map(),
  );

  // Загружаем реальную длительность каждого трека из аудио файлов
  // Это нужно потому что в данных может быть неверная длительность
  useEffect(() => {
    let cancelled = false; // флаг для отмены загрузки если компонент размонтировался
    const audioElements: HTMLAudioElement[] = []; // массив всех созданных audio элементов

    const loadDurations = async () => {
      const durations = new Map<number, number>();

      // Для каждого трека создаем Promise который загрузит метаданные
      const promises = tracks.map((track) => {
        return new Promise<void>((resolve) => {
          // Если загрузка отменена, сразу резолвим
          if (cancelled) {
            resolve();
            return;
          }

          // Создаем новый audio элемент для загрузки метаданных
          const audio = new Audio();
          audioElements.push(audio); // сохраняем для очистки

          // Когда загрузились метаданные (длительность)
          const handleLoadedMetadata = () => {
            // Проверяем что данные валидные и загрузка не отменена
            if (
              !cancelled &&
              isFinite(audio.duration) &&
              !isNaN(audio.duration) &&
              audio.duration > 0
            ) {
              durations.set(track._id, audio.duration); // сохраняем длительность
            }
            // Удаляем обработчики чтобы не было утечек
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('error', handleError);
            resolve();
          };

          // Если произошла ошибка загрузки
          const handleError = () => {
            if (!cancelled) {
              // Используем длительность из исходных данных как fallback
              durations.set(track._id, track.duration_in_seconds);
            }
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('error', handleError);
            resolve();
          };

          // Подписываемся на события
          audio.addEventListener('loadedmetadata', handleLoadedMetadata);
          audio.addEventListener('error', handleError);

          // Устанавливаем preload='metadata' чтобы загрузить только метаданные, не весь файл
          audio.preload = 'metadata';
          audio.src = track.track_file; // начинаем загрузку
        });
      });

      // Ждем пока все треки загрузят метаданные
      await Promise.all(promises);

      // Если загрузка не была отменена, обновляем состояние
      if (!cancelled) {
        setTrackDurations(durations);
      }
    };

    loadDurations();

    // Cleanup функция - выполнится при размонтировании или изменении tracks
    return () => {
      cancelled = true; // помечаем что загрузка отменена
      // Останавливаем загрузку всех audio элементов
      audioElements.forEach((audio) => {
        audio.src = ''; // очищаем источник
        audio.load(); // перезагружаем (это останавливает загрузку)
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

      {/* Список треков - каждый трек это отдельный компонент Track */}
      <div className={styles.playlist}>
        {tracks.map((track) => {
          // Проверяем является ли этот трек текущим
          const isActive = currentTrackId === track._id;
          let displayDuration: string;

          // Для активного трека показываем оставшееся время (обратный отсчет)
          if (isActive && duration > 0) {
            const remainingTime = Math.max(0, duration - currentTime); // Math.max чтобы не было отрицательных значений
            displayDuration = formatDuration(remainingTime);
          } else {
            // Для остальных треков показываем общую длительность
            // Сначала пытаемся взять реальную длительность из загруженных метаданных
            const realDuration = trackDurations.get(track._id);
            // Если реальная длительность есть - используем её, иначе из данных
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
