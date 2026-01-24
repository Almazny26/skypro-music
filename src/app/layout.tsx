import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/store/ReduxProvider";

// Настраиваю шрифт Montserrat - подключаю через Google Fonts
// variable создает CSS переменную, которую можно использовать в стилях
// subsets нужны для поддержки русского языка
// weight - какие начертания шрифта использовать
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

// Метаданные для SEO и отображения в браузере
export const metadata: Metadata = {
  title: "Skypro.Music",
  description: "Музыкальный сервис Skypro.Music",
  icons: {
    icon: '/favicon.ico',
  },
};

// Корневой layout - обертка для всех страниц
// Здесь подключаю Redux Provider, чтобы все компоненты имели доступ к store
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={montserrat.variable}>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
