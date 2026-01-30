'use client';

import { useRouter, usePathname } from 'next/navigation';
import { removeToken } from '@/api/api';
import styles from './LogoutModal.module.css';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export default function LogoutModal({ isOpen, onClose, username }: LogoutModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (!isOpen) return null;

  const handleConfirm = () => {
    removeToken();
    onClose();
    // Если пользователь был на странице избранного, редиректим на главную
    if (pathname === '/favorites') {
      router.push('/');
    } else {
      router.push('/signin');
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleCancel}>
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
