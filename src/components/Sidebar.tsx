'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Sidebar.module.css';
import { getUsername, getToken } from '@/api/api';
import LogoutModal from './LogoutModal';
import AuthModal from './AuthModal';

// Правая боковая панель - показывает имя пользователя и плейлисты
export default function Sidebar() {
  const [username, setUsername] = useState<string>('');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // При загрузке компонента проверяю, нет ли в localStorage мусора
    // Иногда там может быть строка "undefined" вместо реального значения
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem('username');
      if (storedUsername === 'undefined' || storedUsername === 'null') {
        localStorage.removeItem('username');
      }
    }

    // Функция, которая обновляет имя пользователя и проверяет авторизацию
    const updateUsername = () => {
      const token = getToken();
      setIsAuthenticated(!!token); // Есть токен = авторизован
      
      const currentUsername = getUsername();
      // Фильтрую некорректные значения, чтобы не показывать "undefined" в интерфейсе
      if (currentUsername && currentUsername !== 'undefined' && currentUsername !== 'null') {
        setUsername(currentUsername);
      } else {
        setUsername(''); // Если нет имени, покажу "Гость"
      }
    };

    // Проверяю сразу при монтировании компонента
    updateUsername();

    // Слушаю изменения localStorage в других вкладках браузера
    // Это нужно, чтобы если пользователь залогинился в другой вкладке, эта тоже обновилась
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'username' || e.key === 'accessToken') {
        updateUsername();
      }
    };

    // Слушаю кастомное событие для обновления в текущей вкладке
    // Когда пользователь входит/выходит, отправляется событие localStorageChange
    const handleCustomStorageChange = () => {
      updateUsername();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleCustomStorageChange);

    // Cleanup - убираю слушатели при размонтировании
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange);
    };
  }, []);

  // Пока плейлисты не реализованы, просто показываю alert
  const handlePlaylistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('Еще не реализовано');
  };

  // При клике на иконку выхода проверяю авторизацию
  // Если авторизован - показываю модалку подтверждения выхода
  // Если нет - показываю модалку входа/регистрации
  const handleLogoutIconClick = () => {
    if (isAuthenticated) {
      setIsLogoutModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
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
        <div className={styles.logoutIcon} onClick={handleLogoutIconClick}>
          <svg>
            <use href="/img/icon/sprite.svg#logout"></use>
          </svg>
        </div>
      </div>

      {/* Модальное окно подтверждения выхода */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        username={username}
      />

      {/* Модальное окно входа/регистрации */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      
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


