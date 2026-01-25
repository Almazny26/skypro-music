'use client';

import { useParams } from 'next/navigation';
import MainLayout from '../../MainLayout';

// Получаем ID из URL и передаем в MainLayout
export default function CompilationContent() {
  const params = useParams();
  const id = params.id as string;
  const compilationId = parseInt(id, 10);

  // Если ID не число, показываем ошибку
  if (isNaN(compilationId)) {
    return <MainLayout key="invalid" error="Неверный ID подборки" />;
  }

  return <MainLayout compilationId={compilationId} />;
}
