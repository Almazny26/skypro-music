'use client';

import { useParams } from 'next/navigation';
import MainLayout from '../../MainLayout';

// Получаем ID из URL и передаем в MainLayout.
// key по id заставляет React размонтировать/смонтировать MainLayout при смене подборки,
// чтобы не было гонок запросов и устаревшего состояния.
export default function CompilationContent() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const compilationId = id !== undefined && id !== '' ? parseInt(id, 10) : NaN;

  if (id === undefined || id === '' || isNaN(compilationId)) {
    return <MainLayout key="invalid" error="Неверный ID подборки" />;
  }

  return <MainLayout key={id} compilationId={compilationId} />;
}
