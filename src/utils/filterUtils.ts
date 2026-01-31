import type { Track } from '@/api/api';

/** Расширенный поиск: вхождение строки в название, исполнителя, альбом и жанры (без учёта регистра). */
export function filterTracksBySearch(tracks: Track[], query: string): Track[] {
  if (!Array.isArray(tracks)) return [];
  const trimmed = (query || '').trim().toLowerCase();
  if (trimmed === '') return [...tracks];
  return tracks.filter((track) => {
    const name = (track.name || '').toLowerCase();
    const author = (track.author || '').toLowerCase();
    const album = (track.album || '').toLowerCase();
    const genres = Array.isArray(track.genre)
      ? track.genre.join(' ').toLowerCase()
      : '';
    return (
      name.includes(trimmed) ||
      author.includes(trimmed) ||
      album.includes(trimmed) ||
      genres.includes(trimmed)
    );
  });
}

/** Фильтр по автору (точное совпадение). */
export function filterTracksByAuthor(
  tracks: Track[],
  author: string | null
): Track[] {
  if (!Array.isArray(tracks)) return [];
  if (author === null || author === undefined || author === '') return [...tracks];
  return tracks.filter(
    (track) => track.author === author && track.author !== '-'
  );
}

/** Фильтр по жанру (трек содержит жанр). */
export function filterTracksByGenre(
  tracks: Track[],
  genre: string | null
): Track[] {
  if (!Array.isArray(tracks)) return [];
  if (genre === null || genre === undefined || genre === '') return [...tracks];
  return tracks.filter(
    (track) => Array.isArray(track.genre) && track.genre.includes(genre)
  );
}

/** Фильтр по году выпуска. */
export function filterTracksByYear(
  tracks: Track[],
  year: number | null
): Track[] {
  if (!Array.isArray(tracks)) return [];
  if (year === null || year === undefined || Number.isNaN(year)) return [...tracks];
  return tracks.filter((track) => {
    if (!track.release_date) return false;
    const trackYear = new Date(track.release_date).getFullYear();
    return !Number.isNaN(trackYear) && trackYear === year;
  });
}

export type SortOrder = 'asc' | 'desc';

/** Сортировка по дате выпуска. По умолчанию — по убыванию (новые первые). */
export function sortTracksByDate(
  tracks: Track[],
  order: SortOrder = 'desc'
): Track[] {
  if (!Array.isArray(tracks)) return [];
  const copy = [...tracks];
  copy.sort((a, b) => {
    const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
    const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
  return copy;
}

/** Уникальные авторы из треков (без '-' и пустых). */
export function getUniqueAuthors(tracks: Track[]): string[] {
  if (!Array.isArray(tracks)) return [];
  const set = new Set<string>();
  tracks.forEach((track) => {
    if (track.author && track.author !== '-') set.add(track.author);
  });
  return Array.from(set).sort();
}

/** Уникальные жанры из треков. */
export function getUniqueGenres(tracks: Track[]): string[] {
  if (!Array.isArray(tracks)) return [];
  const set = new Set<string>();
  tracks.forEach((track) => {
    if (Array.isArray(track.genre)) track.genre.forEach((g) => set.add(g));
  });
  return Array.from(set).sort();
}

/** Уникальные годы из треков. */
export function getUniqueYears(tracks: Track[]): number[] {
  if (!Array.isArray(tracks)) return [];
  const set = new Set<number>();
  tracks.forEach((track) => {
    if (track.release_date) {
      const year = new Date(track.release_date).getFullYear();
      if (!Number.isNaN(year)) set.add(year);
    }
  });
  return Array.from(set).sort((a, b) => b - a);
}

export interface FilterState {
  searchQuery: string;
  author: string | null;
  genre: string | null;
  year: number | null;
}

/** Применить поиск, фильтры по автору/жанру/году и сортировку по дате. */
export function applyAllFilters(
  tracks: Track[],
  state: FilterState,
  sortOrder: SortOrder = 'desc'
): Track[] {
  if (!Array.isArray(tracks)) return [];
  let result = filterTracksBySearch(tracks, state.searchQuery);
  result = filterTracksByAuthor(result, state.author);
  result = filterTracksByGenre(result, state.genre);
  result = filterTracksByYear(result, state.year);
  return sortTracksByDate(result, sortOrder);
}

/** Есть ли активные фильтры (поиск или выбранные значения). */
export function hasActiveFilters(state: FilterState): boolean {
  const q = (state.searchQuery || '').trim();
  return (
    q !== '' ||
    (state.author != null && state.author !== '') ||
    (state.genre != null && state.genre !== '') ||
    (state.year != null && !Number.isNaN(state.year))
  );
}
