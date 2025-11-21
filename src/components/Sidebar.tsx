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
        {/* Иконка выхода (пока не функциональная) */}
        <div className={styles.icon}>
          <svg>
            <use xlinkHref="/img/icon/sprite.svg#logout"></use>
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

