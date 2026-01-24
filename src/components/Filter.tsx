'use client';

import { useState, useMemo } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setPlaylist } from '@/store/trackSlice';
import classNames from 'classnames';
import styles from './Filter.module.css';
import type { Track } from '@/api/api';

// Типы для фильтров
type FilterType = 'author' | 'year' | 'genre' | null;

interface FilterProps {
  tracks?: Track[];
}

// Компонент фильтров - извлекает уникальные значения из треков и позволяет фильтровать
export default function Filter({ tracks = [] }: FilterProps) {
  const dispatch = useAppDispatch();
  // Отслеживаю, какой фильтр сейчас открыт (null = все закрыты)
  const [openFilter, setOpenFilter] = useState<FilterType>(null);
  // Активный фильтр - какой тип и значение выбраны
  const [activeFilter, setActiveFilter] = useState<{
    type: FilterType;
    value: string | number | null;
  }>({ type: null, value: null });

  // Извлекаю уникальные значения из треков для выпадающих списков
  // Использую useMemo, чтобы не пересчитывать при каждом рендере
  const { uniqueAuthors, uniqueGenres, uniqueYears } = useMemo(() => {
    const authors = new Set<string>();
    const genres = new Set<string>();
    const years = new Set<number>();

    if (!tracks || !Array.isArray(tracks)) {
      return {
        uniqueAuthors: [],
        uniqueGenres: [],
        uniqueYears: [],
      };
    }

    tracks.forEach((track) => {
      // Собираю авторов, пропускаю пустые и дефисы
      if (track.author && track.author !== '-') {
        authors.add(track.author);
      }

      // Жанры приходят массивом, добавляю каждый
      if (track.genre) {
        track.genre.forEach((g) => genres.add(g));
      }

      // Из даты выпуска извлекаю год
      if (track.release_date) {
        const year = new Date(track.release_date).getFullYear();
        if (!isNaN(year)) {
          years.add(year);
        }
      }
    });

    return {
      uniqueAuthors: Array.from(authors).sort(), // Сортирую по алфавиту
      uniqueGenres: Array.from(genres).sort(),
      uniqueYears: Array.from(years).sort((a, b) => b - a), // Годы по убыванию - новые сверху
    };
  }, [tracks]);

  // При клике на кнопку фильтра открываю/закрываю выпадающий список
  const handleFilterClick = (filterType: 'author' | 'year' | 'genre') => {
    // Если кликнули на уже открытый фильтр - закрываю его
    if (openFilter === filterType) {
      setOpenFilter(null);
    } else {
      // Иначе открываю новый фильтр (старый закроется автоматически)
      setOpenFilter(filterType);
    }
  };

  // Когда пользователь выбрал значение из фильтра - применяю его
  const handleFilterSelect = (
    filterType: 'author' | 'year' | 'genre',
    value: string | number
  ) => {
    setActiveFilter({ type: filterType, value });
    setOpenFilter(null); // Закрываю выпадающий список

    // Фильтрую треки в зависимости от типа фильтра
    if (!tracks || !Array.isArray(tracks)) {
      return;
    }

    let filtered = tracks;

    if (filterType === 'author') {
      // Фильтрую по автору
      filtered = tracks.filter(
        (track) => track.author === value && track.author !== '-'
      );
    } else if (filterType === 'year') {
      // Фильтрую по году - извлекаю год из даты и сравниваю
      filtered = tracks.filter((track) => {
        if (track.release_date) {
          const year = new Date(track.release_date).getFullYear();
          return year === value;
        }
        return false;
      });
    } else if (filterType === 'genre') {
      // Фильтрую по жанру - проверяю, есть ли жанр в массиве жанров трека
      filtered = tracks.filter(
        (track) => track.genre && track.genre.includes(value as string)
      );
    }

    // Отправляю отфильтрованные треки в Redux store
    dispatch(setPlaylist(filtered));
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

