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
      setIsAuthenticated(!!token);
    };

    checkAuth();

    // Слушаем изменения в localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
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

  // Обработчик клика по пункту меню
  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('Еще не реализовано');
  };

  // Выход из аккаунта
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    removeToken();
    setIsAuthenticated(false);
    router.push('/signin');
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


