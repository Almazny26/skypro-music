import styles from './Playlist.module.css';
import Track from './Track';
import { data } from '../../data';

// Функция для преобразования секунд в формат MM:SS
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Компонент списка треков (плейлиста)
// Содержит заголовки колонок и список компонентов Track
export default function Playlist() {
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
      {/* Данные получаются из моковых данных data.ts */}
      <div className={styles.playlist}>
        {data.map((track) => (
          <Track
            key={track._id}
            name={track.name}
            author={track.author}
            album={track.album}
            duration={formatDuration(track.duration_in_seconds)}
          />
        ))}
      </div>
    </div>
  );
}


