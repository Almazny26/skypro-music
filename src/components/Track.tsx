'use client';

import Link from 'next/link';
import styles from './Track.module.css';

// Интерфейс для пропсов компонента Track
// Определяет какие данные нужны для отображения одного трека
interface TrackProps {
  track: {
    _id: number;
    name: string;
    author: string;
    album: string;
    duration_in_seconds: number;
    track_file: string;
  };
  duration: string; // Длительность трека (например, "4:44")
  subtitle?: string; // Дополнительная информация (опционально, например "(Remix)")
  isActive?: boolean; // Флаг активного трека
  isPlaying?: boolean; // Флаг воспроизведения трека
  isLiked?: boolean; // Флаг лайкнутого трека
  onSelect: (track: TrackProps['track']) => void; // Обработчик выбора трека
  onToggleLike: () => void; // Обработчик переключения лайка
}

// Компонент одного трека в списке
// Принимает данные о треке через пропсы и отображает их
export default function Track({
  track,
  duration,
  subtitle,
  isActive = false,
  isPlaying = false,
  isLiked = false,
  onSelect,
  onToggleLike,
}: TrackProps) {
  const handleClick = () => {
    onSelect(track);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем всплытие события, чтобы не запускать трек
    onToggleLike();
  };

  return (
    <div 
      className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.track}>
        {/* Блок с названием трека и иконкой */}
        <div className={styles.title}>
          <div className={styles.titleImage}>
            {/* Если трек активен, показываем фиолетовую точку, иначе иконку ноты */}
            {isActive ? (
              <span className={`${styles.playingDot} ${isPlaying ? styles.playingDotAnimated : ''}`}></span>
            ) : (
              <svg className={styles.titleSvg}>
                <use href="/img/icon/sprite.svg#icon-note"></use>
              </svg>
            )}
          </div>
          <div className={styles.titleText}>
            <Link className={styles.titleLink} href="" onClick={(e) => e.preventDefault()}>
              {track.name}
              {/* Если есть subtitle (например, "(Remix)"), отображаем его серым цветом */}
              {subtitle && (
                <span className={styles.titleSpan}> {subtitle}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Блок с именем исполнителя */}
        <div className={styles.author}>
          <Link className={styles.authorLink} href="" onClick={(e) => e.preventDefault()}>
            {track.author}
          </Link>
        </div>

        {/* Блок с названием альбома */}
        <div className={styles.album}>
          <Link className={styles.albumLink} href="" onClick={(e) => e.preventDefault()}>
            {track.album}
          </Link>
        </div>

        {/* Блок с длительностью трека и иконкой лайка */}
        <div className={styles.time}>
          <svg 
            className={`${styles.timeSvg} ${isLiked ? styles.timeSvgLiked : ''}`}
            onClick={handleLikeClick}
            style={{ cursor: 'pointer' }}
          >
            <use href="/img/icon/sprite.svg#icon-like"></use>
          </svg>
          <span className={styles.timeText}>{duration}</span>
        </div>
      </div>
    </div>
  );
}

