import styles from './signup.module.css';
import classNames from 'classnames';
import Link from 'next/link';
import Image from 'next/image';

// Страница регистрации нового пользователя
// Похожа на страницу входа, но с дополнительным полем для подтверждения пароля
export default function SignUp() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.containerEnter}>
        <div className={styles.modalBlock}>
          {/* Форма регистрации */}
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
            <input
              className={classNames(styles.modalInput, styles.login)}
              type="text"
              name="login"
              placeholder="Почта"
            />
            
            {/* Поле ввода пароля */}
            <input
              className={styles.modalInput}
              type="password"
              name="password"
              placeholder="Пароль"
            />
            
            {/* Поле для подтверждения пароля (повторный ввод) */}
            <input
              className={styles.modalInput}
              type="password"
              name="password"
              placeholder="Повторите пароль"
            />
            
            {/* Блок для отображения ошибок валидации */}
            <div className={styles.errorContainer}></div>
            
            {/* Кнопка регистрации */}
            <button className={styles.modalBtnSignupEnt}>
              Зарегистрироваться
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

