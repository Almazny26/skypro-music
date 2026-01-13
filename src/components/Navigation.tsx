'use client';

// Импортируем компоненты Next.js для оптимизированных изображений и навигации
import Image from 'next/image';
import Link from 'next/link';
// Импортируем React хуки для управления состоянием
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Импортируем CSS модуль для стилизации этого компонента
import styles from './Navigation.module.css';
import { getToken, removeToken } from '@/api/api';

// Компонент навигации - левая боковая панель с логотипом и меню
export default function Navigation() {
  const router = useRouter();
  // Состояние для отслеживания открыто/закрыто меню
  // При обновлении страницы меню скрыто
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Проверяем авторизацию при загрузке и при изменении
  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      setIsAuthenticated(!!token);
    };
    
    checkAuth();
    // Проверяем каждую секунду (на случай если токен изменился в другом месте)
    const interval = setInterval(checkAuth, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Обработчик клика на бургер-меню
  const handleBurgerClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Обработчик клика на пункты меню
  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('Еще не реализовано');
  };

  // Обработчик выхода
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


