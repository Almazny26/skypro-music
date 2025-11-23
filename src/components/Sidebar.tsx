import Image from 'next/image';
import Link from 'next/link';
import styles from './Sidebar.module.css';

// Компонент правой боковой панели
// Показывает информацию о пользователе и коллекцию плейлистов
export default function Sidebar() {
  return (
    <div className={styles.sidebar}>
      {/* Блок с информацией о пользователе */}
      <div className={styles.personal}>
        <p className={styles.personalName}>Sergey.Ivanov</p>
        {/* Аватар пользователя */}
        <div className={styles.avatar}>
          <svg className={styles.avatarIcon} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="7" r="3" stroke="white" strokeWidth="1.5"/>
            <path d="M5 17C5 13.134 8.13401 10 12 10C15.866 10 19 13.134 19 17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        {/* Иконка выхода */}
        <div className={styles.logoutIcon}>
          <svg>
            <use href="/img/icon/sprite.svg#logout"></use>
          </svg>
        </div>
      </div>
      
      {/* Блок с коллекцией плейлистов */}
      <div className={styles.block}>
        <div className={styles.list}>
          {/* Каждый плейлист - это изображение, обернутое в ссылку */}
          {/* Пока ссылки ведут на #, позже можно будет переходить на конкретные плейлисты */}
          <div className={styles.item}>
            <Link className={styles.link} href="#">
              <Image
                className={styles.img}
                src="/img/playlist01.png"
                alt="day's playlist"
                width={250}
                height={170}
              />
            </Link>
          </div>
          <div className={styles.item}>
            <Link className={styles.link} href="#">
              <Image
                className={styles.img}
                src="/img/playlist02.png"
                alt="day's playlist"
                width={250}
                height={170}
              />
            </Link>
          </div>
          <div className={styles.item}>
            <Link className={styles.link} href="#">
              <Image
                className={styles.img}
                src="/img/playlist03.png"
                alt="day's playlist"
                width={250}
                height={170}
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


