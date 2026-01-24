'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import classNames from 'classnames';
import { login, register, setToken, setUserInfo } from '@/api/api';
import styles from './AuthModal.module.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Модальное окно для входа/регистрации - показывается, если пользователь не авторизован
export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [isSignIn, setIsSignIn] = useState(true); // Переключатель между входом и регистрацией
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const loginValue = formData.get('login') as string;
    const password = formData.get('password') as string;
    const passwordConfirm = formData.get('passwordConfirm') as string;

    // Проверяю, что обязательные поля заполнены
    if (!loginValue || !password) {
      setError('Заполните все поля');
      setIsLoading(false);
      return;
    }

    // Для регистрации дополнительно проверяю подтверждение пароля
    if (!isSignIn) {
      if (!passwordConfirm) {
        setError('Заполните все поля');
        setIsLoading(false);
        return;
      }
      if (password !== passwordConfirm) {
        setError('Пароли не совпадают');
        setIsLoading(false);
        return;
      }
    }

    // Валидирую формат email, если пользователь ввел email
    const isEmail = loginValue.includes('@');
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(loginValue)) {
        setError('Введите корректный email адрес');
        setIsLoading(false);
        return;
      }
    }

    // Проверяю минимальную длину пароля
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setIsLoading(false);
      return;
    }

    try {
      if (isSignIn) {
        // Логика входа - определяю, что ввел пользователь (email или username)
        const isEmail = loginValue.includes('@');
        const credentials = isEmail
          ? { email: loginValue, password }
          : { username: loginValue, password };
        
        const response = await login(credentials);
        setToken(response.access);
        
        // Определяю username для сохранения - логика такая же, как на странице входа
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
        
        // Дополнительная проверка сохранения
        setTimeout(() => {
          const savedUsername = localStorage.getItem('username');
          if (!savedUsername || savedUsername === 'undefined' || savedUsername === 'null') {
            setUserInfo(usernameToSave, response.email || loginValue);
          }
        }, 50);
      } else {
        // Логика регистрации
        const response = await register({ email: loginValue, password });
        setToken(response.access);
        
        let usernameToSave: string;
        if (response.username) {
          usernameToSave = response.username;
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
      }

      // После успешной авторизации закрываю модалку
      // Компоненты обновятся через событие localStorageChange
      onClose();
    } catch (err) {
      // Показываю ошибку пользователю
      let errorMessage = isSignIn 
        ? 'Произошла ошибка при входе'
        : 'Произошла ошибка при регистрации';
      
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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <Link href="/" onClick={onClose}>
            <div className={styles.modalLogo}>
              <Image
                src="/img/logo_modal.png"
                alt="logo"
                width={140}
                height={21}
              />
            </div>
          </Link>

          {isSignIn ? (
            <>
              <input
                className={classNames(styles.modalInput, styles.login)}
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
            </>
          ) : (
            <>
              <input
                className={classNames(styles.modalInput, styles.login)}
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
            </>
          )}

          {error && (
            <div className={styles.errorContainer}>{error}</div>
          )}

          <button
            type="submit"
            className={styles.modalBtnEnter}
            disabled={isLoading}
          >
            {isLoading 
              ? (isSignIn ? 'Вход...' : 'Регистрация...')
              : (isSignIn ? 'Войти' : 'Зарегистрироваться')
            }
          </button>

          <button
            type="button"
            className={styles.modalBtnSignup}
            onClick={() => {
              setIsSignIn(!isSignIn);
              setError('');
            }}
          >
            {isSignIn ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
