'use client';

import { useState, useMemo } from 'react';
import classNames from 'classnames';
import styles from './Filter.module.css';
import type { Track } from '@/api/api';
import {
  getUniqueAuthors,
  getUniqueGenres,
  getUniqueYears,
} from '@/utils/filterUtils';

type FilterType = 'author' | 'year' | 'genre' | null;

interface FilterProps {
  tracks?: Track[];
  selectedAuthor?: string | null;
  selectedGenre?: string | null;
  selectedYear?: number | null;
  onFilterSelect?: (type: 'author' | 'genre' | 'year', value: string | number | null) => void;
}

export default function Filter({
  tracks = [],
  selectedAuthor = null,
  selectedGenre = null,
  selectedYear = null,
  onFilterSelect,
}: FilterProps) {
  const [openFilter, setOpenFilter] = useState<FilterType>(null);

  const { uniqueAuthors, uniqueGenres, uniqueYears } = useMemo(() => ({
    uniqueAuthors: getUniqueAuthors(tracks),
    uniqueGenres: getUniqueGenres(tracks),
    uniqueYears: getUniqueYears(tracks),
  }), [tracks]);

  const handleFilterClick = (filterType: 'author' | 'year' | 'genre') => {
    if (openFilter === filterType) {
      setOpenFilter(null);
    } else {
      setOpenFilter(filterType);
    }
  };

  const handleFilterSelect = (
    filterType: 'author' | 'year' | 'genre',
    value: string | number | null
  ) => {
    setOpenFilter(null);
    onFilterSelect?.(filterType, value);
  };

  return (
    <div className={styles.filter}>
      <div className={styles.filterTitle}>Искать по:</div>

      <div className={styles.filterWrapper}>
        <div
          className={classNames(styles.filter__button, {
            [styles.active]: openFilter === 'author' || selectedAuthor !== null,
          })}
          onClick={() => handleFilterClick('author')}
        >
          исполнителю
        </div>
        {openFilter === 'author' && (
          <div className={styles.dropdown}>
            <ul className={styles.filter__list}>
              <li
                className={classNames(styles.dropdownItem, styles.dropdownItemReset)}
                onClick={() => handleFilterSelect('author', null)}
              >
                Без фильтра
              </li>
              {uniqueAuthors.map((author) => (
                <li
                  key={author}
                  className={styles.dropdownItem}
                  onClick={() => handleFilterSelect('author', author)}
                >
                  {author}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={styles.filterWrapper}>
        <div
          className={classNames(styles.filter__button, {
            [styles.active]: openFilter === 'year' || selectedYear !== null,
          })}
          onClick={() => handleFilterClick('year')}
        >
          году выпуска
        </div>
        {openFilter === 'year' && (
          <div className={classNames(styles.dropdown, styles.dropdownCompact)}>
            <ul
              className={classNames(
                styles.filter__list,
                styles.filter__listCompact,
              )}
            >
              <li
                className={classNames(styles.dropdownItem, styles.dropdownItemCompact, styles.dropdownItemReset)}
                onClick={() => handleFilterSelect('year', null)}
              >
                Без фильтра
              </li>
              {uniqueYears.map((year) => (
                <li
                  key={year}
                  className={classNames(styles.dropdownItem, styles.dropdownItemCompact)}
                  onClick={() => handleFilterSelect('year', year)}
                >
                  {year}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={styles.filterWrapper}>
        <div
          className={classNames(styles.filter__button, {
            [styles.active]: openFilter === 'genre' || selectedGenre !== null,
          })}
          onClick={() => handleFilterClick('genre')}
        >
          жанру
        </div>
        {openFilter === 'genre' && (
          <div className={styles.dropdown}>
            <ul className={styles.filter__list}>
              <li
                className={classNames(styles.dropdownItem, styles.dropdownItemReset)}
                onClick={() => handleFilterSelect('genre', null)}
              >
                Без фильтра
              </li>
              {uniqueGenres.map((genre) => (
                <li
                  key={genre}
                  className={styles.dropdownItem}
                  onClick={() => handleFilterSelect('genre', genre)}
                >
                  {genre}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
