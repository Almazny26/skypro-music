import MainLayout from './MainLayout';

// Главная страница - просто рендерит MainLayout, который сам загрузит треки на клиенте
export default function Home() {
  return <MainLayout />;
}
