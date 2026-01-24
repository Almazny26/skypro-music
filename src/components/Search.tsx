'use client';

import { useState } from 'react';
import styles from './Search.module.css';

interface SearchProps {
  onSearchChange?: (query: string) => void;
}

// Компонент поиска - простое поле ввода с иконкой
// При вводе текста вызывает callback, чтобы родительский компонент мог фильтровать треки
export default function Search({ onSearchChange }: SearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Передаю значение в родительский компонент для фильтрации
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
