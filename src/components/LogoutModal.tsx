'use client';

import { useRouter } from 'next/navigation';
import { removeToken } from '@/api/api';
import styles from './LogoutModal.module.css';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

// Модальное окно для подтверждения выхода - показывается при клике на иконку выхода
export default function LogoutModal({ isOpen, onClose, username }: LogoutModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  // При подтверждении выхода очищаю токен и редиректю на страницу входа
  const handleConfirm = () => {
    removeToken();
    onClose();
    router.push('/signin');
  };

  // Просто закрываю модалку без действий
  const handleCancel = () => {
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      {/* stopPropagation нужен, чтобы клик по модалке не закрывал её */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Выход из аккаунта</h2>
        <p className={styles.message}>
          Вы действительно хотите выйти из аккаунта <strong>{username}</strong>?
        </p>
        <div className={styles.buttons}>
          <button className={styles.buttonCancel} onClick={handleCancel}>
            Отмена
          </button>
          <button className={styles.buttonConfirm} onClick={handleConfirm}>
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}
