import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { ReduxProvider } from '@/store/ReduxProvider';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Skypro.Music',
  description: 'Музыкальный сервис Skypro.Music',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={montserrat.variable}>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
