'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import styles from './Playlist.module.css';
import Track from '../Track';

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '0:00';
  const roundedSeconds = Math.floor(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

interface PlaylistProps {
  tracks: Array<{
    _id: number;
    name: string;
    author: string;
    album: string;
    duration_in_seconds: number;
    track_file: string;
  }>;
  likedTracks: number[];
  onTrackSelect: (track: PlaylistProps['tracks'][0]) => void;
  onToggleLike: (trackId: number) => void;
}

export default function Playlist({
  tracks,
  likedTracks,
  onTrackSelect,
  onToggleLike,
}: PlaylistProps) {
  const currentTrack = useAppSelector((state) => state.track.currentTrack);
  const isPlaying = useAppSelector((state) => state.track.isPlaying);
  const currentTime = useAppSelector((state) => state.track.currentTime);
  const duration = useAppSelector((state) => state.track.duration);
  const currentTrackId = currentTrack?._id || null;

  const [trackDurations, setTrackDurations] = useState<Map<number, number>>(
    new Map(),
  );

  useEffect(() => {
    let cancelled = false;
    const audioElements: HTMLAudioElement[] = [];

    const loadDurations = async () => {
      const durations = new Map<number, number>();

      const promises = tracks.map((track) => {
        return new Promise<void>((resolve) => {
          if (cancelled) {
            resolve();
            return;
          }

          const audio = new Audio();
          audioElements.push(audio);

          const handleLoadedMetadata = () => {
            if (
              !cancelled &&
              isFinite(audio.duration) &&
              !isNaN(audio.duration) &&
              audio.duration > 0
            ) {
              durations.set(track._id, audio.duration);
            }
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('error', handleError);
            resolve();
          };

          const handleError = () => {
            if (!cancelled) {
              durations.set(track._id, track.duration_in_seconds);
            }
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('error', handleError);
            resolve();
          };

          audio.addEventListener('loadedmetadata', handleLoadedMetadata);
          audio.addEventListener('error', handleError);

          audio.preload = 'metadata';
          audio.src = track.track_file;
        });
      });

      await Promise.all(promises);

      if (!cancelled) {
        setTrackDurations(durations);
      }
    };

    loadDurations();

    return () => {
      cancelled = true;
      audioElements.forEach((audio) => {
        audio.src = '';
        audio.load();
      });
    };
  }, [tracks]);
  return (
    <div className={styles.content}>
      <div className={styles.title}>
        <div className={styles.col01}>Трек</div>
        <div className={styles.col02}>Исполнитель</div>
        <div className={styles.col03}>Альбом</div>
        <div className={styles.col04}>
          <svg className={styles.titleSvg}>
            <use href="/img/icon/sprite.svg#icon-watch"></use>
          </svg>
        </div>
      </div>

      <div className={styles.playlist}>
        {tracks.map((track) => {
          const isActive = currentTrackId === track._id;
          let displayDuration: string;

          if (isActive && duration > 0) {
            const remainingTime = Math.max(0, duration - currentTime);
            displayDuration = formatDuration(remainingTime);
          } else {
            const realDuration = trackDurations.get(track._id);
            const trackDuration =
              realDuration !== undefined
                ? realDuration
                : track.duration_in_seconds;
            displayDuration = formatDuration(trackDuration);
          }

          return (
            <Track
              key={track._id}
              track={track}
              duration={displayDuration}
              isActive={isActive}
              isPlaying={isActive && isPlaying}
              isLiked={likedTracks.includes(track._id)}
              onSelect={onTrackSelect}
              onToggleLike={() => onToggleLike(track._id)}
            />
          );
        })}
      </div>
    </div>
  );
}
