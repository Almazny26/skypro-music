'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Sidebar.module.css';
import { getUsername } from '@/api/api';

// Компонент правой боковой панели
// Показывает информацию о пользователе и коллекцию плейлистов
export default function Sidebar() {
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    // Функция для обновления username
    const updateUsername = () => {
      const currentUsername = getUsername();
      setUsername(currentUsername || '');
    };

    // Проверяем при монтировании
    updateUsername();

    // Слушаем изменения в localStorage (событие storage срабатывает при изменении в других вкладках)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'username') {
        updateUsername();
      }
    };

    // Также слушаем изменения в текущей вкладке через кастомное событие
    const handleCustomStorageChange = () => {
      updateUsername();
    };

    window.addEventListener('storage', handleStorageChange);
    // Добавляем слушатель для обновления при фокусе окна
    window.addEventListener('focus', updateUsername);
    // Слушаем кастомное событие для обновления в той же вкладке
    window.addEventListener('localStorageChange', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', updateUsername);
      window.removeEventListener('localStorageChange', handleCustomStorageChange);
    };
  }, []);

  const handlePlaylistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('Еще не реализовано');
  };

  return (
    <div className={styles.sidebar}>
      {/* Блок с информацией о пользователе */}
      <div className={styles.personal}>
        <p className={styles.personalName}>{username || 'Гость'}</p>
        {/* Аватар пользователя */}
        <div className={styles.avatar}>
          <svg className={styles.avatarIcon} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="7" r="3" stroke="white" strokeWidth="1.5"/>
            <path d="M5 17C5 13.134 8.13401 10 12 10C15.866 10 19 13.134 19 17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        {/* Иконка выхода */}
        <div className={styles.logoutIcon}>
          <svg>
            <use href="/img/icon/sprite.svg#logout"></use>
          </svg>
        </div>
      </div>
      
      {/* Блок с коллекцией плейлистов */}
      <div className={styles.block}>
        <div className={styles.list}>
          {/* Каждый плейлист - это изображение, обернутое в ссылку */}
          {/* Пока ссылки ведут на #, позже можно будет переходить на конкретные плейлисты */}
          <div className={styles.item}>
            <Link className={styles.link} href="#" onClick={handlePlaylistClick}>
              <img
                className={styles.img}
                src="/img/playlist01.png"
                alt="day's playlist"
              />
            </Link>
          </div>
          <div className={styles.item}>
            <Link className={styles.link} href="#" onClick={handlePlaylistClick}>
              <img
                className={styles.img}
                src="/img/playlist02.png"
                alt="day's playlist"
              />
            </Link>
          </div>
          <div className={styles.item}>
            <Link className={styles.link} href="#" onClick={handlePlaylistClick}>
              <img
                className={styles.img}
                src="/img/playlist03.png"
                alt="day's playlist"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


