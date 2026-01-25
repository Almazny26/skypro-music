'use client';

import styles from './signin.module.css';
import classNames from 'classnames';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, setToken, setUserInfo } from '@/api/api';

export default function Signin() {
  const router = useRouter();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const loginValue = formData.get('login') as string;
    const password = formData.get('password') as string;

    if (!loginValue || !password) {
      setError('Заполните все поля');
      setIsLoading(false);
      return;
    }

    const isEmail = loginValue.includes('@');
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(loginValue)) {
        setError('Введите корректный email адрес');
        setIsLoading(false);
        return;
      }
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setIsLoading(false);
      return;
    }

    try {
      const isEmail = loginValue.includes('@');
      const credentials = isEmail
        ? { email: loginValue, password }
        : { username: loginValue, password };

      const response = await login(credentials);
      setToken(response.access);

      let usernameToSave: string;
      if (response.username) {
        usernameToSave = response.username;
      } else if (!isEmail && loginValue) {
        usernameToSave = loginValue;
      } else if (response.email) {
        usernameToSave = response.email.split('@')[0];
      } else {
        usernameToSave = 'Пользователь';
      }

      setUserInfo(usernameToSave, response.email || loginValue);

      setTimeout(() => {
        const savedUsername = localStorage.getItem('username');
        if (!savedUsername || savedUsername === 'undefined' || savedUsername === 'null') {
          setUserInfo(usernameToSave, response.email || loginValue);
        }
      }, 50);

      setTimeout(() => {
        router.push('/');
      }, 200);
    } catch (err) {
      let errorMessage = 'Произошла ошибка при входе';
      
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
                  src="/img/logo_modal.png"
                  alt="logo"
                  width={140}
                  height={21}
                />
              </div>
            </Link>

            <input
              className={classNames(styles.modalInput, styles.login)}
              type="email"
              name="login"
              placeholder="Почта"
              required
            />

            <input
              className={classNames(styles.modalInput)}
              type="password"
              name="password"
              placeholder="Пароль"
              required
            />

            {error && (
              <div className={styles.errorContainer}>{error}</div>
            )}

            <button
              type="submit"
              className={styles.modalBtnEnter}
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>

            <Link href="/signup" className={styles.modalBtnSignup}>
              Зарегистрироваться
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
