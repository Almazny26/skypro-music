'use client';

import styles from './Playlist.module.css';
import Track from './Track';

// Функция для преобразования секунд в формат MM:SS
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
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
  currentTrackId: number | null;
  isPlaying: boolean;
  likedTracks: number[];
  onTrackSelect: (track: PlaylistProps['tracks'][0]) => void;
  onToggleLike: (trackId: number) => void;
}

// Компонент списка треков (плейлиста)
// Содержит заголовки колонок и список компонентов Track
export default function Playlist({ tracks, currentTrackId, isPlaying, likedTracks, onTrackSelect, onToggleLike }: PlaylistProps) {
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
        {tracks.map((track) => (
          <Track
            key={track._id}
            track={track}
            duration={formatDuration(track.duration_in_seconds)}
            isActive={currentTrackId === track._id}
            isPlaying={currentTrackId === track._id && isPlaying}
            isLiked={likedTracks.includes(track._id)}
            onSelect={onTrackSelect}
            onToggleLike={() => onToggleLike(track._id)}
          />
        ))}
      </div>
    </div>
  );
}


