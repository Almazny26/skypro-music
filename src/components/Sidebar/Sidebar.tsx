'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Sidebar.module.css';
import { getUsername, getToken, removeToken } from '@/api/api';
import LogoutModal from '../LogoutModal';
import AuthModal from '../AuthModal';

export default function Sidebar() {
  const [username, setUsername] = useState<string>('');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
          <div className={styles.item}>
            <Link className={styles.link} href="/compilations/1">
              <img
                className={styles.img}
                src="/img/playlist01.png"
                alt="playlist"
              />
            </Link>
          </div>
          <div className={styles.item}>
            <Link className={styles.link} href="/compilations/2">
              <img
                className={styles.img}
                src="/img/playlist02.png"
                alt="playlist"
              />
            </Link>
          </div>
          <div className={styles.item}>
            <Link className={styles.link} href="/compilations/3">
              <img
                className={styles.img}
                src="/img/playlist03.png"
                alt="playlist"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


