'use client';

import styles from './signup.module.css';
import classNames from 'classnames';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register, setToken, setUserInfo } from '@/api/api';

// Страница регистрации нового пользователя
// Похожа на страницу входа, но с дополнительным полем для подтверждения пароля
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

    // Проверка совпадения паролей
    if (password !== passwordConfirm) {
      setError('Пароли не совпадают');
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
      console.log('Отправка данных регистрации:', { email, password: '***' });
      const response = await register({ email, password });
      setToken(response.access);
      setUserInfo(response.username, response.email);
      // Небольшая задержка, чтобы токен успел сохраниться
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 100);
    } catch (err) {
      console.error('Ошибка регистрации:', err);
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при регистрации';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.containerEnter}>
        <div className={styles.modalBlock}>
          {/* Форма регистрации */}
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
            <input
              className={classNames(styles.modalInput, styles.login)}
              type="email"
              name="login"
              placeholder="Почта"
              required
            />
            
            {/* Поле ввода пароля */}
            <input
              className={styles.modalInput}
              type="password"
              name="password"
              placeholder="Пароль"
              required
            />
            
            {/* Поле для подтверждения пароля (повторный ввод) */}
            <input
              className={styles.modalInput}
              type="password"
              name="passwordConfirm"
              placeholder="Повторите пароль"
              required
            />
            
            {/* Блок для отображения ошибок валидации */}
            {error && (
              <div className={styles.errorContainer}>{error}</div>
            )}
            
            {/* Кнопка регистрации */}
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

