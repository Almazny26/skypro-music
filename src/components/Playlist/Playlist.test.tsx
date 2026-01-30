import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReduxProvider } from '@/store/ReduxProvider';
import Playlist from './Playlist';

beforeEach(() => {
  const mockAudio = {
    addEventListener: jest.fn((ev: string, handler: () => void) => {
      if (ev === 'error') setTimeout(handler, 0);
    }),
    removeEventListener: jest.fn(),
    preload: 'metadata',
    src: '',
    load: jest.fn(),
  };
  jest.spyOn(window, 'Audio').mockImplementation(() => mockAudio as unknown as HTMLAudioElement);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const mockTracks = [
  {
    _id: 1,
    name: 'First Track',
    author: 'Artist One',
    album: 'Album 1',
    duration_in_seconds: 180,
    track_file: 'https://example.com/1.mp3',
    stared_user: [],
  },
  {
    _id: 2,
    name: 'Second Track',
    author: 'Artist Two',
    album: 'Album 2',
    duration_in_seconds: 200,
    track_file: 'https://example.com/2.mp3',
    stared_user: [],
  },
];

function renderWithProvider(ui: React.ReactElement) {
  return render(<ReduxProvider>{ui}</ReduxProvider>);
}

describe('Playlist', () => {
  it('рендерит заголовки колонок: Трек, Исполнитель, Альбом', () => {
    renderWithProvider(
      <Playlist
        tracks={mockTracks}
        likedTracks={[]}
        onTrackSelect={jest.fn()}
        onToggleLike={jest.fn()}
      />
    );
    expect(screen.getByText('Трек')).toBeInTheDocument();
    expect(screen.getByText('Исполнитель')).toBeInTheDocument();
    expect(screen.getByText('Альбом')).toBeInTheDocument();
  });

  it('отображает названия треков из списка', () => {
    renderWithProvider(
      <Playlist
        tracks={mockTracks}
        likedTracks={[]}
        onTrackSelect={jest.fn()}
        onToggleLike={jest.fn()}
      />
    );
    expect(screen.getByText('First Track')).toBeInTheDocument();
    expect(screen.getByText('Second Track')).toBeInTheDocument();
  });

  it('отображает авторов и альбомы', () => {
    renderWithProvider(
      <Playlist
        tracks={mockTracks}
        likedTracks={[]}
        onTrackSelect={jest.fn()}
        onToggleLike={jest.fn()}
      />
    );
    expect(screen.getByText('Artist One')).toBeInTheDocument();
    expect(screen.getByText('Artist Two')).toBeInTheDocument();
    expect(screen.getByText('Album 1')).toBeInTheDocument();
    expect(screen.getByText('Album 2')).toBeInTheDocument();
  });

  it('при клике по треку вызывается onTrackSelect с этим треком', async () => {
    const user = userEvent.setup();
    const onTrackSelect = jest.fn();
    renderWithProvider(
      <Playlist
        tracks={mockTracks}
        likedTracks={[]}
        onTrackSelect={onTrackSelect}
        onToggleLike={jest.fn()}
      />
    );
    await user.click(screen.getByText('First Track'));
    expect(onTrackSelect).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 1, name: 'First Track' })
    );
  });

  it('при пустом списке треков не рендерит треки', () => {
    renderWithProvider(
      <Playlist
        tracks={[]}
        likedTracks={[]}
        onTrackSelect={jest.fn()}
        onToggleLike={jest.fn()}
      />
    );
    expect(screen.queryByText('First Track')).not.toBeInTheDocument();
    expect(screen.getByText('Трек')).toBeInTheDocument();
  });
});
