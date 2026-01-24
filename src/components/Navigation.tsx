'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Navigation.module.css';
import { getToken, removeToken } from '@/api/api';

// Левая боковая панель с логотипом и меню
export default function Navigation() {
  const router = useRouter();
  // Состояние меню - по умолчанию закрыто
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Проверяю авторизацию при загрузке и слушаю изменения
  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      setIsAuthenticated(!!token); // Есть токен = авторизован
    };
    
    // Проверяю сразу при монтировании
    checkAuth();
    
    // Слушаю изменения в других вкладках браузера
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        checkAuth();
      }
    };

    // Слушаю изменения в текущей вкладке (при входе/выходе)
    const handleCustomStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleCustomStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange);
    };
  }, []);

  // Открываю/закрываю меню по клику на бургер
  const handleBurgerClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Пока пункты меню не реализованы
  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('Еще не реализовано');
  };

  // Выход из аккаунта - очищаю токен и редирект на страницу входа
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    removeToken();
    setIsAuthenticated(false);
    router.push('/signin');
  };

  return (
    <nav className={styles.nav}>
      {/* Блок с логотипом приложения */}
      <div className={styles.logo}>
        {/* Image из Next.js автоматически оптимизирует изображения */}
        <Image
          width={113}
          height={17}
          className={styles.logoImage}
          src="/img/logo.png"
          alt="logo"
        />
      </div>
      
      {/* Бургер-меню с обработчиком клика */}
      <div className={`${styles.burger} ${isMenuOpen ? styles.burgerOpen : ''}`} onClick={handleBurgerClick}>
        <span className={styles.burgerLine}></span>
        <span className={styles.burgerLine}></span>
        <span className={styles.burgerLine}></span>
      </div>
      
      {/* Меню навигации - показывается/скрывается в зависимости от состояния */}
      <div className={`${styles.menu} ${!isMenuOpen ? styles.menuClosed : ''}`}>
        <ul className={styles.menuList}>
          <li className={styles.menuItem}>
            {/* Link из Next.js обеспечивает клиентскую навигацию без перезагрузки страницы */}
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


