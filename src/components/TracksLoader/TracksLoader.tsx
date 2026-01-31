'use client';

import styles from './TracksLoader.module.css';

const TRACK_ROWS_COUNT = 8;

export default function TracksLoader() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>
        <div className={styles.labelIconWrap}>
          <svg className={styles.noteIcon} aria-hidden>
            <use href="/img/icon/sprite.svg#icon-note" />
          </svg>
        </div>
        <div className={`${styles.skeleton} ${styles.labelText}`} />
      </div>

      <div className={`${styles.skeleton} ${styles.searchRow}`} />
      <div className={`${styles.skeleton} ${styles.titleRow}`} />
      <div className={styles.filterRow}>
        <div className={`${styles.skeleton} ${styles.filterChip}`} />
        <div className={`${styles.skeleton} ${styles.filterChip}`} />
        <div className={`${styles.skeleton} ${styles.filterChip}`} />
      </div>

      <div className={styles.tracksList}>
        {Array.from({ length: TRACK_ROWS_COUNT }).map((_, index) => (
          <div key={index} className={styles.trackRow}>
            <div className={`${styles.skeleton} ${styles.trackIcon}`} />
            <div className={styles.trackInfo}>
              <div className={`${styles.skeleton} ${styles.trackTitle}`} />
              <div className={`${styles.skeleton} ${styles.trackAuthor}`} />
            </div>
            <div className={`${styles.skeleton} ${styles.trackAlbum}`} />
            <div className={`${styles.skeleton} ${styles.trackTime}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
