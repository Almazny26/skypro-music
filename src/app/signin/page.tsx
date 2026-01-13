'use client';

import styles from './signin.module.css';
// classNames - библиотека для удобного объединения CSS классов
import classNames from 'classnames';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, setToken, setUserInfo } from '@/api/api';

// Страница входа в систему
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

    // Проверка длины пароля
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setIsLoading(false);
      return;
    }

    try {
      // Определяем, является ли значение email или username
      // Если содержит @, считаем email, иначе username
      const isEmail = loginValue.includes('@');
      const credentials = isEmail
        ? { email: loginValue, password }
        : { username: loginValue, password };
      
      const response = await login(credentials);
      setToken(response.access);
      setUserInfo(response.username, response.email);
      // Небольшая задержка, чтобы токен успел сохраниться
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 100);
    } catch (err) {
      console.error('Ошибка авторизации:', err);
      setError(
        err instanceof Error ? err.message : 'Произошла ошибка при входе'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.containerEnter}>
        <div className={styles.modalBlock}>
          {/* Форма входа */}
          <form className={styles.modalForm} onSubmit={handleSubmit}>
            {/* Логотип с ссылкой на главную страницу */}
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

            {/* Поле ввода email/почты */}
            {/* classNames объединяет несколько классов: базовый modalInput и login для отступа */}
            <input
              className={classNames(styles.modalInput, styles.login)}
              type="email"
              name="login"
              placeholder="Почта"
              required
            />

            {/* Поле ввода пароля */}
            <input
              className={classNames(styles.modalInput)}
              type="password"
              name="password"
              placeholder="Пароль"
              required
            />

            {/* Блок для отображения ошибок валидации */}
            {error && (
              <div className={styles.errorContainer}>{error}</div>
            )}

            {/* Кнопка входа */}
            <button
              type="submit"
              className={styles.modalBtnEnter}
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>

            {/* Ссылка на страницу регистрации */}
            <Link href="/signup" className={styles.modalBtnSignup}>
              Зарегистрироваться
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
