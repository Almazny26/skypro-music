'use client';

// Импортируем компоненты Next.js для оптимизированных изображений и навигации
import Image from 'next/image';
import Link from 'next/link';
// Импортируем React хуки для управления состоянием
import { useState } from 'react';
// Импортируем CSS модуль для стилизации этого компонента
import styles from './Navigation.module.css';

// Компонент навигации - левая боковая панель с логотипом и меню
export default function Navigation() {
  // Состояние для отслеживания открыто/закрыто меню
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  // Обработчик клика на бургер-меню
  const handleBurgerClick = () => {
    setIsMenuOpen(!isMenuOpen);
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
      <div className={styles.burger} onClick={handleBurgerClick}>
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
            <Link href="#" className={styles.menuLink}>
              Мой плейлист
            </Link>
          </li>
          <li className={styles.menuItem}>
            <Link href="/signin" className={styles.menuLink}>
              Войти
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

