import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Filter from './Filter';
import type { Track } from '@/api/api';

const mockTracks: Track[] = [
  {
    _id: 1,
    name: 'Track One',
    author: 'Artist A',
    album: 'Album 1',
    duration_in_seconds: 180,
    track_file: 'https://example.com/1.mp3',
    release_date: '2022-01-01',
    genre: ['Rock', 'Pop'],
  },
  {
    _id: 2,
    name: 'Track Two',
    author: 'Artist B',
    album: 'Album 2',
    duration_in_seconds: 200,
    track_file: 'https://example.com/2.mp3',
    release_date: '2020-06-15',
    genre: ['Jazz'],
  },
  {
    _id: 3,
    name: 'Track Three',
    author: 'Artist A',
    album: 'Album 3',
    duration_in_seconds: 220,
    track_file: 'https://example.com/3.mp3',
    release_date: '2021-03-10',
    genre: ['Rock'],
  },
];

describe('Filter', () => {
  it('рендерит заголовок "Искать по:" и кнопки фильтров', () => {
    render(<Filter tracks={mockTracks} />);
    expect(screen.getByText('Искать по:')).toBeInTheDocument();
    expect(screen.getByText('исполнителю')).toBeInTheDocument();
    expect(screen.getByText('году выпуска')).toBeInTheDocument();
    expect(screen.getByText('жанру')).toBeInTheDocument();
  });

  it('при клике на "исполнителю" открывается выпадающий список с авторами из неотфильтрованных треков', async () => {
    const user = userEvent.setup();
    render(<Filter tracks={mockTracks} />);
    await user.click(screen.getByText('исполнителю'));
    expect(screen.getByText('Artist A')).toBeInTheDocument();
    expect(screen.getByText('Artist B')).toBeInTheDocument();
  });

  it('при выборе автора вызывается onFilterSelect', async () => {
    const user = userEvent.setup();
    const onFilterSelect = jest.fn();
    render(<Filter tracks={mockTracks} onFilterSelect={onFilterSelect} />);
    await user.click(screen.getByText('исполнителю'));
    await user.click(screen.getByText('Artist A'));
    expect(onFilterSelect).toHaveBeenCalledWith('author', 'Artist A');
  });

  it('при клике на "жанру" открывается список жанров из неотфильтрованных треков', async () => {
    const user = userEvent.setup();
    render(<Filter tracks={mockTracks} />);
    await user.click(screen.getByText('жанру'));
    expect(screen.getByText('Rock')).toBeInTheDocument();
    expect(screen.getByText('Pop')).toBeInTheDocument();
    expect(screen.getByText('Jazz')).toBeInTheDocument();
  });

  it('при выборе жанра вызывается onFilterSelect', async () => {
    const user = userEvent.setup();
    const onFilterSelect = jest.fn();
    render(<Filter tracks={mockTracks} onFilterSelect={onFilterSelect} />);
    await user.click(screen.getByText('жанру'));
    await user.click(screen.getByText('Jazz'));
    expect(onFilterSelect).toHaveBeenCalledWith('genre', 'Jazz');
  });

  it('при клике на "году выпуска" открывается список годов', async () => {
    const user = userEvent.setup();
    render(<Filter tracks={mockTracks} />);
    await user.click(screen.getByText('году выпуска'));
    expect(screen.getByText('2022')).toBeInTheDocument();
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText('2021')).toBeInTheDocument();
  });

  it('при выборе года вызывается onFilterSelect', async () => {
    const user = userEvent.setup();
    const onFilterSelect = jest.fn();
    render(<Filter tracks={mockTracks} onFilterSelect={onFilterSelect} />);
    await user.click(screen.getByText('году выпуска'));
    await user.click(screen.getByText('2022'));
    expect(onFilterSelect).toHaveBeenCalledWith('year', 2022);
  });

  it('при пустом tracks отображается только пункт "Без фильтра"', async () => {
    const user = userEvent.setup();
    render(<Filter tracks={[]} />);
    await user.click(screen.getByText('исполнителю'));
    const list = screen.getByRole('list');
    const items = within(list).queryAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent('Без фильтра');
  });

  it('кнопка активна, когда выбран соответствующий фильтр', () => {
    render(
      <Filter
        tracks={mockTracks}
        selectedAuthor="Artist A"
        selectedGenre={null}
        selectedYear={null}
      />
    );
    const authorButton = screen.getByText('исполнителю');
    expect(authorButton.className).toMatch(/active/);
  });

  it('при выборе "Без фильтра" вызывается onFilterSelect с null', async () => {
    const user = userEvent.setup();
    const onFilterSelect = jest.fn();
    render(<Filter tracks={mockTracks} onFilterSelect={onFilterSelect} />);
    await user.click(screen.getByText('исполнителю'));
    await user.click(screen.getByText('Без фильтра'));
    expect(onFilterSelect).toHaveBeenCalledWith('author', null);
  });
});
