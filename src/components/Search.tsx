'use client';

import { useState } from 'react';
import styles from './Search.module.css';

// Интерфейс для пропсов компонента Search
interface SearchProps {
  onSearchChange?: (query: string) => void;
}

// Компонент поиска - строка ввода с иконкой поиска
export default function Search({ onSearchChange }: SearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Вызываем callback для уведомления родительского компонента
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

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
        value={searchQuery}
        onChange={handleInputChange}
      />
    </div>
  );
}
