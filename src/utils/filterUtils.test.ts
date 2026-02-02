import type { Track } from '@/api/api';
import {
  filterTracksBySearch,
  filterTracksByAuthor,
  filterTracksByGenre,
  filterTracksByYear,
  sortTracksByDate,
  getUniqueAuthors,
  getUniqueGenres,
  getUniqueYears,
  applyAllFilters,
  hasActiveFilters,
  type FilterState,
  type SortOrder,
} from './filterUtils';

const mockTracks: Track[] = [
  {
    _id: 1,
    name: 'Alpha Song',
    author: 'Artist A',
    album: 'Album 1',
    duration_in_seconds: 180,
    track_file: 'https://example.com/1.mp3',
    release_date: '2022-01-01',
    genre: ['Rock', 'Pop'],
  },
  {
    _id: 2,
    name: 'Beta Track',
    author: 'Artist B',
    album: 'Album 2',
    duration_in_seconds: 200,
    track_file: 'https://example.com/2.mp3',
    release_date: '2020-06-15',
    genre: ['Jazz'],
  },
  {
    _id: 3,
    name: 'Alpha Beta',
    author: 'Artist A',
    album: 'Album 3',
    duration_in_seconds: 220,
    track_file: 'https://example.com/3.mp3',
    release_date: '2021-03-10',
    genre: ['Rock'],
  },
  {
    _id: 4,
    name: 'Gamma',
    author: '-',
    album: 'Album 4',
    duration_in_seconds: 190,
    track_file: 'https://example.com/4.mp3',
    release_date: '2019-12-31',
    genre: ['Pop'],
  },
];

describe('filterUtils', () => {
  describe('filterTracksBySearch', () => {
    it('возвращает копию всех треков при пустом запросе', () => {
      const result = filterTracksBySearch(mockTracks, '');
      expect(result).toHaveLength(mockTracks.length);
      expect(result).not.toBe(mockTracks);
    });

    it('возвращает треки по вхождению в названии, исполнителе, альбоме и жанрах (без учёта регистра)', () => {
      expect(filterTracksBySearch(mockTracks, 'Al')).toHaveLength(2);
      expect(filterTracksBySearch(mockTracks, 'al')).toHaveLength(2);
      expect(filterTracksBySearch(mockTracks, 'Alpha')).toHaveLength(2);
      expect(filterTracksBySearch(mockTracks, 'Beta')).toHaveLength(2);
      expect(filterTracksBySearch(mockTracks, 'Gamma')).toHaveLength(1);
      expect(filterTracksBySearch(mockTracks, 'Song')).toHaveLength(1);
      expect(filterTracksBySearch(mockTracks, 'Track')).toHaveLength(1);
      expect(filterTracksBySearch(mockTracks, 'Artist')).toHaveLength(3);
      expect(filterTracksBySearch(mockTracks, 'Album')).toHaveLength(4);
      expect(filterTracksBySearch(mockTracks, 'Rock')).toHaveLength(2);
      expect(filterTracksBySearch(mockTracks, 'Jazz')).toHaveLength(1);
    });

    it('не возвращает треки при отсутствии вхождения', () => {
      expect(filterTracksBySearch(mockTracks, 'xyz')).toHaveLength(0);
      expect(filterTracksBySearch(mockTracks, 'Unknown')).toHaveLength(0);
    });

    it('обрезает пробелы в запросе', () => {
      expect(filterTracksBySearch(mockTracks, '  Alpha  ')).toHaveLength(2);
    });

    it('возвращает пустой массив при не-массиве', () => {
      expect(filterTracksBySearch(null as unknown as Track[], 'a')).toEqual([]);
      expect(filterTracksBySearch(undefined as unknown as Track[], 'a')).toEqual([]);
    });

    it('обрабатывает треки без name', () => {
      const withEmpty = [{ ...mockTracks[0], name: '' }];
      expect(filterTracksBySearch(withEmpty, 'x')).toHaveLength(0);
      expect(filterTracksBySearch(withEmpty, '')).toHaveLength(1);
    });
  });

  describe('filterTracksByAuthor', () => {
    it('возвращает копию всех треков при null/пустом авторе', () => {
      expect(filterTracksByAuthor(mockTracks, null)).toHaveLength(mockTracks.length);
      expect(filterTracksByAuthor(mockTracks, '')).toHaveLength(mockTracks.length);
    });

    it('фильтрует по автору (исключает "-")', () => {
      const result = filterTracksByAuthor(mockTracks, 'Artist A');
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.author === 'Artist A')).toBe(true);
      expect(filterTracksByAuthor(mockTracks, '-')).toHaveLength(0);
    });

    it('возвращает пустой массив при не-массиве', () => {
      expect(filterTracksByAuthor(null as unknown as Track[], 'A')).toEqual([]);
    });
  });

  describe('filterTracksByGenre', () => {
    it('возвращает копию всех треков при null/пустом жанре', () => {
      expect(filterTracksByGenre(mockTracks, null)).toHaveLength(mockTracks.length);
      expect(filterTracksByGenre(mockTracks, '')).toHaveLength(mockTracks.length);
    });

    it('фильтрует по жанру', () => {
      expect(filterTracksByGenre(mockTracks, 'Rock')).toHaveLength(2);
      expect(filterTracksByGenre(mockTracks, 'Jazz')).toHaveLength(1);
      expect(filterTracksByGenre(mockTracks, 'Pop')).toHaveLength(2);
    });

    it('возвращает пустой массив при не-массиве', () => {
      expect(filterTracksByGenre(null as unknown as Track[], 'Rock')).toEqual([]);
    });

    it('игнорирует треки без genre', () => {
      const noGenre = [{ ...mockTracks[0], genre: undefined }];
      expect(filterTracksByGenre(noGenre, 'Rock')).toHaveLength(0);
    });
  });

  describe('filterTracksByYear', () => {
    it('возвращает копию всех треков при null/NaN году', () => {
      expect(filterTracksByYear(mockTracks, null)).toHaveLength(mockTracks.length);
      expect(filterTracksByYear(mockTracks, Number.NaN)).toHaveLength(mockTracks.length);
    });

    it('фильтрует по году', () => {
      expect(filterTracksByYear(mockTracks, 2022)).toHaveLength(1);
      expect(filterTracksByYear(mockTracks, 2020)).toHaveLength(1);
      expect(filterTracksByYear(mockTracks, 2019)).toHaveLength(1);
    });

    it('возвращает пустой массив при не-массиве', () => {
      expect(filterTracksByYear(null as unknown as Track[], 2020)).toEqual([]);
    });

    it('игнорирует треки без release_date', () => {
      const noDate = [{ ...mockTracks[0], release_date: undefined }];
      expect(filterTracksByYear(noDate, 2022)).toHaveLength(0);
    });
  });

  describe('sortTracksByDate', () => {
    it('сортирует по убыванию даты по умолчанию (desc)', () => {
      const result = sortTracksByDate(mockTracks);
      expect(result[0]._id).toBe(1);
      expect(result[result.length - 1]._id).toBe(4);
    });

    it('сортирует по возрастанию при order asc', () => {
      const result = sortTracksByDate(mockTracks, 'asc');
      expect(result[0]._id).toBe(4);
      expect(result[result.length - 1]._id).toBe(1);
    });

    it('не мутирует исходный массив', () => {
      const copy = [...mockTracks];
      sortTracksByDate(mockTracks);
      expect(mockTracks).toEqual(copy);
    });

    it('возвращает пустой массив при не-массиве', () => {
      expect(sortTracksByDate(null as unknown as Track[])).toEqual([]);
    });

    it('обрабатывает треки без release_date (timestamp 0)', () => {
      const withNoDate = [
        { ...mockTracks[0], release_date: undefined },
        { ...mockTracks[1] },
      ];
      const result = sortTracksByDate(withNoDate, 'desc');
      expect(result).toHaveLength(2);
    });
  });

  describe('getUniqueAuthors', () => {
    it('возвращает уникальных авторов без "-"', () => {
      const result = getUniqueAuthors(mockTracks);
      expect(result).toContain('Artist A');
      expect(result).toContain('Artist B');
      expect(result).not.toContain('-');
      expect(result).toHaveLength(2);
      expect(result).toEqual([...result].sort());
    });

    it('возвращает пустой массив при не-массиве', () => {
      expect(getUniqueAuthors(null as unknown as Track[])).toEqual([]);
    });
  });

  describe('getUniqueGenres', () => {
    it('возвращает уникальные жанры', () => {
      const result = getUniqueGenres(mockTracks);
      expect(result).toContain('Rock');
      expect(result).toContain('Pop');
      expect(result).toContain('Jazz');
      expect(result).toEqual([...result].sort());
    });

    it('возвращает пустой массив при не-массиве', () => {
      expect(getUniqueGenres(null as unknown as Track[])).toEqual([]);
    });
  });

  describe('getUniqueYears', () => {
    it('возвращает уникальные годы по убыванию', () => {
      const result = getUniqueYears(mockTracks);
      expect(result).toContain(2022);
      expect(result).toContain(2020);
      expect(result).toContain(2021);
      expect(result).toContain(2019);
      expect(result).toEqual([...result].sort((a, b) => b - a));
    });

    it('возвращает пустой массив при не-массиве', () => {
      expect(getUniqueYears(null as unknown as Track[])).toEqual([]);
    });
  });

  describe('applyAllFilters', () => {
    it('применяет поиск, фильтры и сортировку', () => {
      const state: FilterState = {
        searchQuery: 'Alpha',
        author: 'Artist A',
        genre: 'Rock',
        year: 2022,
      };
      const result = applyAllFilters(mockTracks, state);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alpha Song');
    });

    it('при пустом состоянии возвращает все треки, отсортированные по дате', () => {
      const state: FilterState = {
        searchQuery: '',
        author: null,
        genre: null,
        year: null,
      };
      const result = applyAllFilters(mockTracks, state);
      expect(result).toHaveLength(mockTracks.length);
      expect(result[0]._id).toBe(1);
    });

    it('возвращает пустой массив при не-массиве', () => {
      const state: FilterState = {
        searchQuery: '',
        author: null,
        genre: null,
        year: null,
      };
      expect(applyAllFilters(null as unknown as Track[], state)).toEqual([]);
    });

    it('совместные условия: результат соответствует всем', () => {
      const state: FilterState = {
        searchQuery: 'Al',
        author: 'Artist A',
        genre: 'Rock',
        year: 2022,
      };
      const result = applyAllFilters(mockTracks, state);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alpha Song');
    });
  });

  describe('hasActiveFilters', () => {
    it('возвращает false при пустом состоянии', () => {
      expect(
        hasActiveFilters({
          searchQuery: '',
          author: null,
          genre: null,
          year: null,
        })
      ).toBe(false);
    });

    it('возвращает true при непустом поиске', () => {
      expect(
        hasActiveFilters({
          searchQuery: 'a',
          author: null,
          genre: null,
          year: null,
        })
      ).toBe(true);
    });

    it('возвращает true при выбранном авторе/жанре/году', () => {
      expect(
        hasActiveFilters({
          searchQuery: '',
          author: 'A',
          genre: null,
          year: null,
        })
      ).toBe(true);
      expect(
        hasActiveFilters({
          searchQuery: '',
          author: null,
          genre: 'Rock',
          year: null,
        })
      ).toBe(true);
      expect(
        hasActiveFilters({
          searchQuery: '',
          author: null,
          genre: null,
          year: 2020,
        })
      ).toBe(true);
    });
  });
});
