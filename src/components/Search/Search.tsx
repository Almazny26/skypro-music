'use client';

import { useState } from 'react';
import styles from './Search.module.css';

interface SearchProps {
  value?: string;
  onSearchChange?: (query: string) => void;
}

export default function Search({ value = '', onSearchChange }: SearchProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onSearchChange?.(newValue);
  };

  return (
    <div className={styles.search}>
      <svg className={styles.searchSvg}>
        <use href="/img/icon/sprite.svg#icon-search"></use>
      </svg>
      <input
        className={styles.searchText}
        type="search"
        placeholder={isFocused ? '' : 'Поиск'}
        name="search"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label="Поиск треков"
      />
    </div>
  );
}
