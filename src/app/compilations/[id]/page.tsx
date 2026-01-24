import { Suspense } from 'react';
import { getCompilationTracks } from '@/api/api';
import MainLayout from '../../MainLayout';
import type { Track } from '@/api/api';
import Skeleton from '@/components/Skeleton';

// Компонент, который загружает треки подборки на сервере
// Вынес отдельно, чтобы обернуть в Suspense и показать скелетон во время загрузки
async function CompilationContent({
  compilationId,
}: {
  compilationId: number;
}) {
  let tracks: Track[] = [];
  let error: string | null = null;

  try {
    tracks = await getCompilationTracks(compilationId);
  } catch (err) {
    // Если ошибка - передаю её в MainLayout, он покажет сообщение пользователю
    error =
      err instanceof Error
        ? err.message
        : 'Произошла ошибка при загрузке треков подборки';
  }

  return <MainLayout tracks={tracks} error={error} />;
}

// Страница подборки - получаю ID из URL и загружаю треки этой подборки
export default async function CompilationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const compilationId = parseInt(id, 10);

  // Оборачиваю в Suspense, чтобы показывать скелетон во время загрузки
  // Это исправляет ошибку React про async cleanup
  return (
    <Suspense fallback={<Skeleton />}>
      <CompilationContent compilationId={compilationId} />
    </Suspense>
  );
}
