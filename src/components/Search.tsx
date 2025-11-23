import styles from './Search.module.css';

// Компонент поиска - строка ввода с иконкой поиска
// Пока только визуальная часть, функционал поиска будет добавлен позже
export default function Search() {
  return (
    <div className={styles.search}>
      {/* Иконка поиска из SVG спрайта */}
      <svg className={styles.searchSvg}>
        <use href="/img/icon/sprite.svg#icon-search"></use>
      </svg>
      {/* Поле ввода для поиска треков */}
      <input
        className={styles.searchText}
        type="search"
        placeholder="Поиск"
        name="search"
      />
    </div>
  );
}


