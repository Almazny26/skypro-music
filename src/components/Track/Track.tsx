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
  duration: string;
  subtitle?: string;
  isActive?: boolean;
  isPlaying?: boolean;
  isLiked?: boolean;
  onSelect: (track: TrackProps['track']) => void;
  onToggleLike: () => void;
}

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
        <div className={styles.title}>
          <div className={styles.titleImage}>
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
              {subtitle && (
                <span className={styles.titleSpan}> {subtitle}</span>
              )}
            </span>
          </div>
        </div>

        <div className={styles.author}>
          <span className={styles.authorLink}>
            {track.author}
          </span>
        </div>

        <div className={styles.album}>
          <span className={styles.albumLink}>
            {track.album}
          </span>
        </div>

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

