'use client';

import styles from './signin.module.css';
import classNames from 'classnames';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, setToken, setUserInfo } from '@/api/api';

// Страница входа - пользователь может войти по email или username
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

    // Проверяю, что поля заполнены
    if (!loginValue || !password) {
      setError('Заполните все поля');
      setIsLoading(false);
      return;
    }

    // Если пользователь ввел email, проверяю его формат
    const isEmail = loginValue.includes('@');
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(loginValue)) {
        setError('Введите корректный email адрес');
        setIsLoading(false);
        return;
      }
    }

    // Минимальная длина пароля - 6 символов
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setIsLoading(false);
      return;
    }

    try {
      // Определяю, что ввел пользователь - email или username
      // Если есть @, значит email, иначе username
      const isEmail = loginValue.includes('@');
      const credentials = isEmail
        ? { email: loginValue, password }
        : { username: loginValue, password };
      
      const response = await login(credentials);
      setToken(response.access); // Сохраняю токен для последующих запросов
      
      // Определяю, какое имя сохранить для отображения в интерфейсе
      let usernameToSave: string;
      if (response.username) {
        // Если API вернул username - использую его
        usernameToSave = response.username;
      } else if (!isEmail && loginValue) {
        // Если пользователь вводил username (не email), использую его
        usernameToSave = loginValue;
      } else if (response.email) {
        // Если вводил email, беру часть до @ как username
        usernameToSave = response.email.split('@')[0];
      } else {
        // На крайний случай - дефолтное значение
        usernameToSave = 'Пользователь';
      }
      
      setUserInfo(usernameToSave, response.email || loginValue);
      
      // Дополнительная проверка - иногда localStorage глючит, пересохраняю если нужно
      setTimeout(() => {
        const savedUsername = localStorage.getItem('username');
        if (!savedUsername || savedUsername === 'undefined' || savedUsername === 'null') {
          setUserInfo(usernameToSave, response.email || loginValue);
        }
      }, 50);
      
      // Небольшая задержка перед редиректом, чтобы данные точно сохранились
      setTimeout(() => {
        router.push('/'); // Переход на главную без перезагрузки страницы
      }, 200);
    } catch (err) {
      // Обрабатываю ошибки от API и показываю пользователю понятное сообщение
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
