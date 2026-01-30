'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Navigation.module.css';
import { getToken, removeToken } from '@/api/api';

// Компонент навигации
export default function Navigation() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Проверка авторизации при загрузке и изменении токена
  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      const username = typeof window !== 'undefined' ? localStorage.getItem('username') : null;
      
      // Пользователь авторизован, если есть токен ИЛИ username
      // Это нужно для поддержки session authentication
      const authenticated = Boolean(
        (token && token.trim() !== '') ||
        (username && username !== 'undefined' && username !== 'null' && username.trim() !== '')
      );
      setIsAuthenticated(authenticated);
    };

    checkAuth();

    // Слушаем изменения в localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'username') {
        checkAuth();
      }
    };

    const handleCustomStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleCustomStorageChange);

    // Очистка слушателей
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange);
    };
  }, []);

  // Открытие/закрытие меню
  const handleBurgerClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Обработчик клика по пункту меню "Мой плейлист"
  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      router.push('/favorites');
    } else {
      router.push('/signin');
    }
  };

  // Выход из аккаунта
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    removeToken();
    setIsAuthenticated(false);
    // Если пользователь был на странице избранного, редиректим на главную
    const currentPath = window.location.pathname;
    if (currentPath === '/favorites') {
      router.push('/');
    } else {
      router.push('/signin');
    }
  };

  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo}>
        <Image
          width={113}
          height={17}
          className={styles.logoImage}
          src="/img/logo.png"
          alt="logo"
        />
      </Link>

      <div className={`${styles.burger} ${isMenuOpen ? styles.burgerOpen : ''}`} onClick={handleBurgerClick}>
        <span className={styles.burgerLine}></span>
        <span className={styles.burgerLine}></span>
        <span className={styles.burgerLine}></span>
      </div>

      <div className={`${styles.menu} ${!isMenuOpen ? styles.menuClosed : ''}`}>
        <ul className={styles.menuList}>
          <li className={styles.menuItem}>
            <Link href="/" className={styles.menuLink}>
              Главное
            </Link>
          </li>
          <li className={styles.menuItem}>
            <Link href="#" className={styles.menuLink} onClick={handleMenuClick}>
              Мой плейлист
            </Link>
          </li>
          <li className={styles.menuItem}>
            {isAuthenticated ? (
              <Link href="#" className={styles.menuLink} onClick={handleLogout}>
                Выйти
              </Link>
            ) : (
              <Link href="/signin" className={styles.menuLink}>
                Войти
              </Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}


