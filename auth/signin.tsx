import styles from './signin.module.css';
import classNames from 'classnames';
import Link from 'next/link';

export default function Signin() {
    return (
        <>
            <div className={styles.wrapper}>
                <div className={styles.containerEnter}>
                    <div className={styles.modal__block}>
                        <form className={styles.modal__form}>
                            <a href="/music/main">
                                <div className={styles.modal__logo}>
                                    <img src="/img/logo_modal.png" alt="logo" />
                                </div>
                            </a>
                            <input
                                className={classNames(styles.modal__input, styles.login)}
                                type="text"
                                name="login"
                                placeholder="Почта"
                            />
                            <input
                                className={classNames(styles.modal__input)}
                                type="password"
                                name="password"
                                placeholder="Пароль"
                            />
                            <div className={styles.errorContainer}>{/*Блок для ошибок*/}</div>
                            <button className={styles.modal__btnEnter}>Войти</button>
                            <Link href={''} className={styles.modal__btnSignup}>
                                Зарегистрироваться
                            </Link>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
