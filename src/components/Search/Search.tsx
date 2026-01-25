'use client';

import { useState } from 'react';
import styles from './Search.module.css';

interface SearchProps {
  onSearchChange?: (query: string) => void;
}

export default function Search({ onSearchChange }: SearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  return (
    <div className={styles.search}>
      <svg className={styles.searchSvg}>
        <use href="/img/icon/sprite.svg#icon-search"></use>
      </svg>
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
