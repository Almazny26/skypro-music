'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Sidebar.module.css';
import { getUsername, getToken, removeToken, getCompilations } from '@/api/api';
import type { CompilationResponse } from '@/api/api';
import LogoutModal from '../LogoutModal';
import AuthModal from '../AuthModal';

const PLAYLIST_IMAGES = ['/img/playlist01.png', '/img/playlist02.png', '/img/playlist03.png'];

// Порядок подборок: 1-я картинка = Плейлист дня, 2-я = 100 танцевальных хитов, 3-я = Инди заряд
function compilationSortOrder(name: string): number {
  const n = (name || '').toLowerCase();
  if (n.includes('плейлист') && n.includes('дня')) return 0;
  if (n.includes('инди') && n.includes('заряд')) return 2;
  // «100 танцевальных хитов» — разные варианты названия с API
  if ((n.includes('100') && (n.includes('хит') || n.includes('танцевальн'))) ||
      (n.includes('танцевальн') && n.includes('хит'))) return 1;
  return 99;
}

export default function Sidebar() {
  const [username, setUsername] = useState<string>('');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [compilations, setCompilations] = useState<CompilationResponse[]>([]);

  useEffect(() => {
    const loadCompilations = async () => {
      try {
        const list = await getCompilations();
        const withTracks = list.filter(
          (c) => (c.tracks && c.tracks.length > 0) || (c.items && c.items.length > 0)
        );
        withTracks.sort((a, b) => {
          const orderA = compilationSortOrder(a.name);
          const orderB = compilationSortOrder(b.name);
          if (orderA !== orderB) return orderA - orderB;
          return (a.name || '').localeCompare(b.name || '');
        });
        setCompilations(withTracks);
      } catch {
        setCompilations([]);
      }
    };
    loadCompilations();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem('username');
      if (storedUsername === 'undefined' || storedUsername === 'null') {
        localStorage.removeItem('username');
      }
    }

    const updateUsername = () => {
      const token = getToken();
      setIsAuthenticated(!!token);

      const currentUsername = getUsername();
      if (currentUsername && currentUsername !== 'undefined' && currentUsername !== 'null') {
        setUsername(currentUsername);
      } else {
        setUsername('');
      }
    };

    updateUsername();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'username' || e.key === 'accessToken') {
        updateUsername();
      }
    };
    const handleCustomStorageChange = () => {
      updateUsername();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange);
    };
  }, []);

  const handleLogoutIconClick = () => {
    if (isAuthenticated) {
      removeToken();
      // Если пользователь был на странице избранного, редиректим на главную
      const currentPath = window.location.pathname;
      if (currentPath === '/favorites') {
        window.location.href = '/';
      } else {
        window.location.href = '/signin';
      }
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.personal}>
        <p className={styles.personalName}>{username || 'Гость'}</p>
        <div className={styles.avatar}>
          <svg className={styles.avatarIcon} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="7" r="3" stroke="white" strokeWidth="1.5"/>
            <path d="M5 17C5 13.134 8.13401 10 12 10C15.866 10 19 13.134 19 17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className={styles.logoutIcon} onClick={handleLogoutIconClick}>
          <svg>
            <use href="/img/icon/sprite.svg#logout"></use>
          </svg>
        </div>
      </div>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        username={username}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <div className={styles.block}>
        <div className={styles.list}>
          {compilations.map((comp, index) => (
            <div key={comp.id} className={styles.item}>
              <Link className={styles.link} href={`/compilations/${comp.id}`}>
                <img
                  className={styles.img}
                  src={PLAYLIST_IMAGES[index % PLAYLIST_IMAGES.length]}
                  alt={comp.name || 'Подборка'}
                />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


