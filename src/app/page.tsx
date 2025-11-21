// Импортируем стили для главной страницы
import styles from './page.module.css';
// Импортируем все компоненты, из которых состоит главная страница
// @ - это алиас для папки src, настроен в tsconfig.json
import Navigation from '@/components/Navigation';
import Search from '@/components/Search';
import Filter from '@/components/Filter';
import Playlist from '@/components/Playlist';
import Sidebar from '@/components/Sidebar';
import PlayerBar from '@/components/PlayerBar';

// Главная страница приложения - собирает все компоненты вместе
export default function Home() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <main className={styles.main}>
          {/* Левая навигационная панель с меню */}
          <Navigation />
          
          {/* Центральный блок с поиском, фильтрами и списком треков */}
          <div className={styles.centerblock}>
            <Search />
            <h2 className={styles.h2}>Треки</h2>
            <Filter />
            <Playlist />
          </div>
          
          {/* Правая боковая панель с плейлистами */}
          <Sidebar />
        </main>
        
        {/* Плеер внизу страницы - фиксированная позиция */}
        <PlayerBar />
        <footer className={styles.footer}></footer>
      </div>
    </div>
  );
}
