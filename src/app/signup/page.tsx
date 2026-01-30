'use client';

import styles from './page.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register, setToken, setUserInfo } from '@/api/api';

export default function SignUp() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('login') as string;
    const password = formData.get('password') as string;
    const passwordConfirm = formData.get('passwordConfirm') as string;

    if (!email || !password || !passwordConfirm) {
      setError('Заполните все поля');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Введите корректный email адрес');
      setIsLoading(false);
      return;
    }

    if (password !== passwordConfirm) {
      setError('Пароли не совпадают');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setIsLoading(false);
      return;
    }

    try {
      const response = await register({ email, password });
      
      // Проверяем, что токен действительно получен
      if (response.access && response.access !== 'undefined' && response.access.trim() !== '') {
        setToken(response.access);
      }

      let usernameToSave: string;
      if (response.username) {
        usernameToSave = response.username;
      } else if (response.email) {
        usernameToSave = response.email.split('@')[0];
      } else {
        usernameToSave = 'Пользователь';
      }

      setUserInfo(usernameToSave, response.email || email);

      setTimeout(() => {
        const savedUsername = localStorage.getItem('username');
        if (!savedUsername || savedUsername === 'undefined' || savedUsername === 'null') {
          setUserInfo(usernameToSave, response.email || email);
        }
      }, 50);

      setTimeout(() => {
        router.push('/');
      }, 200);
    } catch (err) {
      let errorMessage = 'Произошла ошибка при регистрации';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.containerEnter}>
        <div className={styles.modalBlock}>
          <form className={styles.modalForm} onSubmit={handleSubmit}>
            <Link href="/">
              <div className={styles.modalLogo}>
                <Image
                  src="/img/logo.png"
                  alt="logo"
                  width={140}
                  height={21}
                />
              </div>
            </Link>

            <input
              className={styles.modalInput}
              type="email"
              name="login"
              placeholder="Почта"
              required
            />

            <input
              className={styles.modalInput}
              type="password"
              name="password"
              placeholder="Пароль"
              required
            />

            <input
              className={styles.modalInput}
              type="password"
              name="passwordConfirm"
              placeholder="Повторите пароль"
              required
            />

            {error && (
              <div className={styles.errorContainer}>{error}</div>
            )}

            <button
              type="submit"
              className={styles.modalBtnSignupEnt}
              disabled={isLoading}
            >
              {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

