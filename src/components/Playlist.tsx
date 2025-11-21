import styles from './Playlist.module.css';
import Track from './Track';

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
            <use xlinkHref="/img/icon/sprite.svg#icon-watch"></use>
          </svg>
        </div>
      </div>
      
      {/* Список треков - каждый трек это отдельный компонент Track */}
      {/* Пока данные захардкожены, позже будут приходить из API или state */}
      <div className={styles.playlist}>
        <Track name="Guilt" author="Nero" album="Welcome Reality" duration="4:44" />
        <Track name="Elektro" author="Dynoro, Outwork, Mr. Gee" album="Elektro" duration="2:22" />
        <Track name="I'm Fire" author="Ali Bakgor" album="I'm Fire" duration="2:22" />
        {/* Пример трека с дополнительной информацией (subtitle) */}
        <Track name="Non Stop" author="Стоункат, Psychopath" album="Non Stop" duration="4:12" subtitle="(Remix)" />
        <Track name="Run Run" author="Jaded, Will Clarke, AR/CO" album="Run Run" duration="2:54" subtitle="(feat. AR/CO)" />
      </div>
    </div>
  );
}

