import Link from 'next/link';
import styles from './Track.module.css';

// Интерфейс для пропсов компонента Track
// Определяет какие данные нужны для отображения одного трека
interface TrackProps {
  name: string; // Название трека
  author: string; // Исполнитель
  album: string; // Название альбома
  duration: string; // Длительность трека (например, "4:44")
  subtitle?: string; // Дополнительная информация (опционально, например "(Remix)")
}

// Компонент одного трека в списке
// Принимает данные о треке через пропсы и отображает их
export default function Track({
  name,
  author,
  album,
  duration,
  subtitle,
}: TrackProps) {
  return (
    <div className={styles.item}>
      <div className={styles.track}>
        {/* Блок с названием трека и иконкой */}
        <div className={styles.title}>
          <div className={styles.titleImage}>
            {/* Иконка ноты из SVG спрайта */}
            <svg className={styles.titleSvg}>
              <use xlinkHref="/img/icon/sprite.svg#icon-note"></use>
            </svg>
          </div>
          <div className={styles.titleText}>
            <Link className={styles.titleLink} href="">
              {name}
              {/* Если есть subtitle (например, "(Remix)"), отображаем его серым цветом */}
              {subtitle && (
                <span className={styles.titleSpan}> {subtitle}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Блок с именем исполнителя */}
        <div className={styles.author}>
          <Link className={styles.authorLink} href="">
            {author}
          </Link>
        </div>

        {/* Блок с названием альбома */}
        <div className={styles.album}>
          <Link className={styles.albumLink} href="">
            {album}
          </Link>
        </div>

        {/* Блок с длительностью трека и иконкой лайка */}
        <div className={styles.time}>
          <svg className={styles.timeSvg}>
            <use xlinkHref="/img/icon/sprite.svg#icon-like"></use>
          </svg>
          <span className={styles.timeText}>{duration}</span>
        </div>
      </div>
    </div>
  );
}
