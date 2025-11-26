'use client';

import styles from './signup.module.css';
import classNames from 'classnames';
import Link from 'next/link';
import Image from 'next/image';

// Страница регистрации нового пользователя
// Похожа на страницу входа, но с дополнительным полем для подтверждения пароля
export default function SignUp() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Реализовать логику регистрации
    alert('Еще не реализовано');
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
            <div className={styles.errorContainer}></div>
            
            {/* Кнопка регистрации */}
            <button type="submit" className={styles.modalBtnSignupEnt}>
              Зарегистрироваться
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

