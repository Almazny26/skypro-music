'use client';

import styles from './signup.module.css';
import classNames from 'classnames';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register, setToken, setUserInfo } from '@/api/api';

// Страница регистрации - почти как вход, но с полем подтверждения пароля
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

    // Проверяю, что все поля заполнены
    if (!email || !password || !passwordConfirm) {
      setError('Заполните все поля');
      setIsLoading(false);
      return;
    }

    // Валидирую формат email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Введите корректный email адрес');
      setIsLoading(false);
      return;
    }

    // Проверяю, что пароли совпадают
    if (password !== passwordConfirm) {
      setError('Пароли не совпадают');
      setIsLoading(false);
      return;
    }

    // Минимальная длина пароля
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setIsLoading(false);
      return;
    }

    try {
      const response = await register({ email, password });
      setToken(response.access);
      
      // Определяю username для сохранения - логика такая же, как при входе
      let usernameToSave: string;
      if (response.username) {
        usernameToSave = response.username;
      } else if (response.email) {
        // Берем часть email до @ как username
        usernameToSave = response.email.split('@')[0];
      } else {
        usernameToSave = 'Пользователь';
      }
      
      setUserInfo(usernameToSave, response.email || email);
      
      // Дополнительная проверка сохранения
      setTimeout(() => {
        const savedUsername = localStorage.getItem('username');
        if (!savedUsername || savedUsername === 'undefined' || savedUsername === 'null') {
          setUserInfo(usernameToSave, response.email || email);
        }
      }, 50);
      
      // Задержка перед редиректом
      setTimeout(() => {
        router.push('/');
      }, 200);
    } catch (err) {
      // Показываю ошибку пользователю
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

