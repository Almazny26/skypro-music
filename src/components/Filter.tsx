'use client';

import { useState, useMemo } from 'react';
import classNames from 'classnames';
import styles from './Filter.module.css';
import { data } from '../../data';

// Типы для фильтров
type FilterType = 'author' | 'year' | 'genre' | null;

// Компонент фильтров - кнопки для фильтрации треков
export default function Filter() {
  // Состояние для отслеживания открытого фильтра (null - ничего не открыто)
  const [openFilter, setOpenFilter] = useState<FilterType>(null);

  // Извлекаем уникальные значения из данных треков
  const { uniqueAuthors, uniqueGenres, uniqueYears } = useMemo(() => {
    const authors = new Set<string>();
    const genres = new Set<string>();
    const years = new Set<number>();

    data.forEach((track) => {
      // Добавляем автора (если не пустой)
      if (track.author && track.author !== '-') {
        authors.add(track.author);
      }

      // Добавляем жанры (из массива)
      track.genre.forEach((g) => genres.add(g));

      // Извлекаем год из даты выпуска
      if (track.release_date) {
        const year = new Date(track.release_date).getFullYear();
        if (!isNaN(year)) {
          years.add(year);
        }
      }
    });

    return {
      uniqueAuthors: Array.from(authors).sort(),
      uniqueGenres: Array.from(genres).sort(),
      uniqueYears: Array.from(years).sort((a, b) => b - a), // Сортируем по убыванию
    };
  }, []);

  // Обработчик клика на кнопку фильтра
  const handleFilterClick = (filterType: 'author' | 'year' | 'genre') => {
    // Если кликнули на уже открытый фильтр - закрываем его
    if (openFilter === filterType) {
      setOpenFilter(null);
    } else {
      // Иначе открываем новый фильтр
      setOpenFilter(filterType);
    }
  };

  // Обработчик выбора значения фильтра
  const handleFilterSelect = (filterType: 'author' | 'year' | 'genre', value: string | number) => {
    // TODO: Реализовать логику фильтрации треков
    alert(`Еще не реализовано: Фильтр по ${filterType === 'author' ? 'исполнителю' : filterType === 'year' ? 'году' : 'жанру'} - ${value}`);
    setOpenFilter(null);
  };

  return (
    <div className={styles.filter}>
      <div className={styles.filterTitle}>Искать по:</div>

      {/* Кнопка фильтра по исполнителю */}
      <div className={styles.filterWrapper}>
        <div
          className={classNames(styles.filter__button, {
            [styles.active]: openFilter === 'author',
          })}
          onClick={() => handleFilterClick('author')}
        >
          исполнителю
        </div>
        {openFilter === 'author' && (
          <div className={styles.dropdown}>
            <ul className={styles.filter__list}>
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

      {/* Кнопка фильтра по году выпуска */}
      <div className={styles.filterWrapper}>
        <div
          className={classNames(styles.filter__button, {
            [styles.active]: openFilter === 'year',
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

      {/* Кнопка фильтра по жанру */}
      <div className={styles.filterWrapper}>
        <div
          className={classNames(styles.filter__button, {
            [styles.active]: openFilter === 'genre',
          })}
          onClick={() => handleFilterClick('genre')}
        >
          жанру
        </div>
        {openFilter === 'genre' && (
          <div className={styles.dropdown}>
            <ul className={styles.filter__list}>
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

