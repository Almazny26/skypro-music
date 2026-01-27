'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../MainLayout';
import type { Track } from '@/api/api';
import { getFavoriteTracks, getToken, getUsername } from '@/api/api';

export default function FavoritesPage() {
  const router = useRouter();
  const [favoriteTracks, setFavoriteTracks] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [removingTrackId, setRemovingTrackId] = useState<number | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Проверка авторизации
  useEffect(() => {
    const token = getToken();
    const username = getUsername();
    
    if ((!token || token.trim() === '') && (!username || username === 'undefined' || username === 'null')) {
      router.push('/signin');
    }
  }, [router]);

  const loadFavoriteTracks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const tracks = await getFavoriteTracks();
      setFavoriteTracks(tracks);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Произошла ошибка при загрузке избранных треков';
      setError(errorMessage);
      setFavoriteTracks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavoriteTracks();

    const handleFavoriteUpdate = () => {
      loadFavoriteTracks();
    };

    window.addEventListener('favoritesUpdated', handleFavoriteUpdate);

    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoriteUpdate);
    };
  }, [loadFavoriteTracks]); // loadFavoriteTracks мемоизирован, так что это безопасно

  const handleRemoveFromFavorites = useCallback((trackId: number) => {
    if (removingTrackId === trackId) return;

    setRemovingTrackId(trackId);
    setRemoveError(null);

    // Обновляем локальное состояние
    setFavoriteTracks((prev) => prev.filter((track) => track._id !== trackId));

    // Обновляем localStorage
    if (typeof window !== 'undefined') {
      try {
        const savedLikes = localStorage.getItem('likedTracks');
        if (savedLikes) {
          const likedTrackIds = JSON.parse(savedLikes);
          if (Array.isArray(likedTrackIds)) {
            const newLikedTracks = likedTrackIds.filter((id: number) => id !== trackId);
            localStorage.setItem('likedTracks', JSON.stringify(newLikedTracks));
          }
        }
      } catch (err) {
        setRemoveError('Не удалось удалить трек из избранного.');
        setTimeout(() => setRemoveError(null), 5000);
      }
    }

    setRemovingTrackId(null);
  }, [removingTrackId]);

  if (isLoading) {
    return (
      <MainLayout>
        <div style={{ color: '#fff', padding: '20px', textAlign: 'center' }}>
          Загрузка избранных треков...
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
          {error}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      tracks={favoriteTracks} 
      error={favoriteTracks.length === 0 ? 'У вас пока нет избранных треков' : null}
      onRemoveFromFavorites={handleRemoveFromFavorites}
      removingTrackId={removingTrackId}
      removeError={removeError}
      pageTitle="Мой плейлист"
    />
  );
}
