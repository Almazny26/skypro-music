import Link from 'next/link';
import styles from './PlayerBar.module.css';

// Компонент плеера - фиксированная панель внизу страницы
// Пока только визуальная часть, функционал воспроизведения будет добавлен позже
export default function PlayerBar() {
  return (
    <div className={styles.bar}>
      <div className={styles.content}>
        {/* Полоса прогресса воспроизведения (пока пустая) */}
        <div className={styles.playerProgress}></div>
        
        <div className={styles.playerBlock}>
          <div className={styles.player}>
            {/* Блок с кнопками управления плеером */}
            <div className={styles.controls}>
              {/* Кнопка "Предыдущий трек" */}
              <div className={styles.btnPrev}>
                <svg className={styles.btnPrevSvg}>
                  <use xlinkHref="/img/icon/sprite.svg#icon-prev"></use>
                </svg>
              </div>
              
              {/* Кнопка "Play/Pause" - основная кнопка управления */}
              {/* Используем classnames для объединения нескольких классов */}
              <div className={`${styles.btnPlay} ${styles.btn}`}>
                <svg className={styles.btnPlaySvg}>
                  <use xlinkHref="/img/icon/sprite.svg#icon-play"></use>
                </svg>
              </div>
              
              {/* Кнопка "Следующий трек" */}
              <div className={styles.btnNext}>
                <svg className={styles.btnNextSvg}>
                  <use xlinkHref="/img/icon/sprite.svg#icon-next"></use>
                </svg>
              </div>
              
              {/* Кнопка "Повтор" */}
              <div className={`${styles.btnRepeat} ${styles.btnIcon}`}>
                <svg className={styles.btnRepeatSvg}>
                  <use xlinkHref="/img/icon/sprite.svg#icon-repeat"></use>
                </svg>
              </div>
              
              {/* Кнопка "Перемешать" */}
              <div className={`${styles.btnShuffle} ${styles.btnIcon}`}>
                <svg className={styles.btnShuffleSvg}>
                  <use xlinkHref="/img/icon/sprite.svg#icon-shuffle"></use>
                </svg>
              </div>
            </div>

            {/* Блок с информацией о текущем треке */}
            <div className={styles.trackPlay}>
              <div className={styles.contain}>
                {/* Иконка текущего трека */}
                <div className={styles.image}>
                  <svg className={styles.svg}>
                    <use xlinkHref="/img/icon/sprite.svg#icon-note"></use>
                  </svg>
                </div>
                
                {/* Название текущего трека */}
                <div className={styles.author}>
                  <Link className={styles.authorLink} href="">
                    Ты та...
                  </Link>
                </div>
                
                {/* Исполнитель текущего трека */}
                <div className={styles.album}>
                  <Link className={styles.albumLink} href="">
                    Баста
                  </Link>
                </div>
              </div>

              {/* Кнопки лайка и дизлайка */}
              <div className={styles.dislike}>
                <div className={`${styles.btnShuffle} ${styles.btnIcon}`}>
                  <svg className={styles.likeSvg}>
                    <use xlinkHref="/img/icon/sprite.svg#icon-like"></use>
                  </svg>
                </div>
                <div className={`${styles.dislikeBtn} ${styles.btnIcon}`}>
                  <svg className={styles.dislikeSvg}>
                    <use xlinkHref="/img/icon/sprite.svg#icon-dislike"></use>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Блок управления громкостью */}
          <div className={styles.volumeBlock}>
            <div className={styles.volumeContent}>
              {/* Иконка громкости */}
              <div className={styles.volumeImage}>
                <svg className={styles.volumeSvg}>
                  <use xlinkHref="/img/icon/sprite.svg#icon-volume"></use>
                </svg>
              </div>
              
              {/* Ползунок громкости */}
              <div className={`${styles.volumeProgress} ${styles.btn}`}>
                <input
                  className={`${styles.volumeProgressLine} ${styles.btn}`}
                  type="range"
                  name="range"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

