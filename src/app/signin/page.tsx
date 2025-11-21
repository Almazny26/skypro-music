import styles from './signin.module.css';
// classNames - библиотека для удобного объединения CSS классов
import classNames from 'classnames';
import Link from 'next/link';
import Image from 'next/image';

// Страница входа в систему
// Пока только форма без функционала авторизации
export default function Signin() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.containerEnter}>
        <div className={styles.modalBlock}>
          {/* Форма входа */}
          <form className={styles.modalForm}>
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
              type="text"
              name="login"
              placeholder="Почта"
            />

            {/* Поле ввода пароля */}
            <input
              className={classNames(styles.modalInput)}
              type="password"
              name="password"
              placeholder="Пароль"
            />

            {/* Блок для отображения ошибок валидации (пока пустой) */}
            <div className={styles.errorContainer}>{/*Блок для ошибок*/}</div>

            {/* Кнопка входа */}
            <button className={styles.modalBtnEnter}>Войти</button>

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
