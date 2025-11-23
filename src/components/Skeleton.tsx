import styles from './Skeleton.module.css';

// Компонент скелетона - показывает серые квадратики во время загрузки
export default function Skeleton() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <main className={styles.main}>
          {/* Левая навигационная панель - скелетон */}
          <div className={styles.nav}>
            <div className={styles.skeletonBox} style={{ width: '113px', height: '17px', marginBottom: '20px' }}></div>
            <div className={styles.skeletonBox} style={{ width: '20px', height: '36px', marginBottom: '20px' }}></div>
            <div className={styles.skeletonBox} style={{ width: '100px', height: '24px', marginBottom: '16px' }}></div>
            <div className={styles.skeletonBox} style={{ width: '120px', height: '24px', marginBottom: '16px' }}></div>
            <div className={styles.skeletonBox} style={{ width: '80px', height: '24px' }}></div>
          </div>
          
          {/* Центральный блок - скелетон */}
          <div className={styles.centerblock}>
            {/* Скелетон поиска */}
            <div className={styles.skeletonBox} style={{ width: '100%', height: '51px', marginBottom: '51px' }}></div>
            
            {/* Скелетон заголовка */}
            <div className={styles.skeletonBox} style={{ width: '172px', height: '72px', marginBottom: '45px' }}></div>
            
            {/* Скелетон фильтров */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '51px' }}>
              <div className={styles.skeletonBox} style={{ width: '144px', height: '39px' }}></div>
              <div className={styles.skeletonBox} style={{ width: '144px', height: '39px' }}></div>
              <div className={styles.skeletonBox} style={{ width: '91px', height: '39px' }}></div>
            </div>
            
            {/* Скелетон списка треков */}
            <div className={styles.tracksList}>
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className={styles.trackSkeleton}>
                  <div className={styles.skeletonBox} style={{ width: '51px', height: '51px' }}></div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className={styles.skeletonBox} style={{ width: '200px', height: '20px' }}></div>
                    <div className={styles.skeletonBox} style={{ width: '150px', height: '16px' }}></div>
                  </div>
                  <div className={styles.skeletonBox} style={{ width: '150px', height: '20px' }}></div>
                  <div className={styles.skeletonBox} style={{ width: '100px', height: '20px' }}></div>
                  <div className={styles.skeletonBox} style={{ width: '40px', height: '20px' }}></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Правая боковая панель - скелетон */}
          <div className={styles.sidebar}>
            {/* Скелетон блока пользователя */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '351.51px' }}>
              <div className={styles.skeletonBox} style={{ width: '120px', height: '24px', marginRight: '16px' }}></div>
              <div className={styles.skeletonBox} style={{ width: '43px', height: '43px', borderRadius: '50%' }}></div>
            </div>
            
            {/* Скелетон карточек плейлистов */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '64.49px' }}>
              <div className={styles.skeletonBox} style={{ width: '250px', height: '150px' }}></div>
              <div className={styles.skeletonBox} style={{ width: '250px', height: '150px' }}></div>
              <div className={styles.skeletonBox} style={{ width: '250px', height: '150px' }}></div>
            </div>
          </div>
        </main>
        
        {/* Скелетон плеера */}
        <div className={styles.playerBar}>
          <div className={styles.skeletonBox} style={{ width: '100%', height: '5px' }}></div>
          <div className={styles.skeletonBox} style={{ width: '100%', height: '73px' }}></div>
        </div>
      </div>
    </div>
  );
}

