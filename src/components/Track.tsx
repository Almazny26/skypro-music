'use client';

import styles from './Track.module.css';

// Описываю какие пропсы принимает компонент Track
interface TrackProps {
  track: {
    _id: number;
    name: string;
    author: string;
    album: string;
    duration_in_seconds: number;
    track_file: string;
  };
  duration: string; // длительность в формате "4:44" (уже отформатированная)
  subtitle?: string; // опциональное поле, например "(Remix)"
  isActive?: boolean; // является ли этот трек текущим
  isPlaying?: boolean; // играет ли сейчас этот трек
  isLiked?: boolean; // лайкнут ли трек
  onSelect: (track: TrackProps['track']) => void; // функция которая вызывается при клике на трек
  onToggleLike: () => void; // функция для переключения лайка
}

// Компонент для отображения одного трека в списке
export default function Track({
  track,
  duration,
  subtitle,
  isActive = false, // по умолчанию не активен
  isPlaying = false,
  isLiked = false,
  onSelect,
  onToggleLike,
}: TrackProps) {
  // Обработчик клика на весь трек
  const handleClick = () => {
    onSelect(track); // передаем трек в родительский компонент
  };

  // Обработчик клика на иконку лайка
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // останавливаем всплытие события, чтобы не запускался трек при клике на лайк
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

