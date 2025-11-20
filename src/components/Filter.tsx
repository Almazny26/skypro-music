import styles from './Filter.module.css';

// Компонент фильтров - кнопки для фильтрации треков
// Пока только визуальная часть, логика фильтрации будет добавлена позже
export default function Filter() {
  return (
    <div className={styles.filter}>
      <div className={styles.filterTitle}>Искать по:</div>
      {/* Кнопки фильтров - можно будет кликать для фильтрации списка треков */}
      <div className={styles.filterButton}>исполнителю</div>
      <div className={styles.filterButton}>году выпуска</div>
      <div className={styles.filterButton}>жанру</div>
    </div>
  );
}

