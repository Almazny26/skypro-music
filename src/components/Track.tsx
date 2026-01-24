'use client';

import styles from './Track.module.css';

interface TrackProps {
  track: {
    _id: number;
    name: string;
    author: string;
    album: string;
    duration_in_seconds: number;
    track_file: string;
  };
  duration: string; // Длительность уже в формате "4:44"
  subtitle?: string; // Опциональное поле, например "(Remix)"
  isActive?: boolean; // Является ли этот трек текущим (играющим)
  isPlaying?: boolean; // Играет ли сейчас этот трек
  isLiked?: boolean; // Лайкнут ли трек пользователем
  onSelect: (track: TrackProps['track']) => void; // Callback при клике на трек
  onToggleLike: () => void; // Callback для переключения лайка
}

// Компонент одной строки трека в списке - показывает название, автора, альбом и длительность
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
  // При клике на трек передаю его в родительский компонент для воспроизведения
  const handleClick = () => {
    onSelect(track);
  };

  // При клике на лайк останавливаю всплытие события, чтобы не запускался трек
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
            {/* Если трек активен - показываем точку (анимированную если играет), иначе иконку ноты */}
            {isActive ? (
              <span className={`${styles.playingDot} ${isPlaying ? styles.playingDotAnimated : ''}`}></span>
            ) : (
              <svg className={styles.titleSvg}>
                <use href="/img/icon/sprite.svg#icon-note"></use>
              </svg>
            )}
          </div>
          <div className={styles.titleText}>
            <span className={styles.titleLink}>
              {track.name}
              {/* Если есть subtitle (например, "(Remix)"), отображаем его серым цветом */}
              {subtitle && (
                <span className={styles.titleSpan}> {subtitle}</span>
              )}
            </span>
          </div>
        </div>

        {/* Блок с именем исполнителя */}
        <div className={styles.author}>
          <span className={styles.authorLink}>
            {track.author}
          </span>
        </div>

        {/* Блок с названием альбома */}
        <div className={styles.album}>
          <span className={styles.albumLink}>
            {track.album}
          </span>
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

