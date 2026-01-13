import { getCompilationTracks } from '@/api/api';
import MainLayout from '../../MainLayout';
import type { Track } from '@/api/api';

// Страница подборок - получает треки конкретной подборки из API
export default async function CompilationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const compilationId = parseInt(id, 10);

  let tracks: Track[] = [];
  let error: string | null = null;

  try {
    tracks = await getCompilationTracks(compilationId);
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : 'Произошла ошибка при загрузке треков подборки';
  }

  return <MainLayout tracks={tracks} error={error} />;
}
