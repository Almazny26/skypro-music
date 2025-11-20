// Импортируем необходимые типы и функции из Next.js
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

// Настраиваем шрифт Montserrat через Google Fonts
// variable - создает CSS переменную для использования в стилях
// subsets - подключаем латиницу и кириллицу для поддержки русского языка
// weight - указываем доступные начертания шрифта
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

// Метаданные страницы - отображаются в браузере (заголовок вкладки, описание)
export const metadata: Metadata = {
  title: "Skypro.Music",
  description: "Музыкальный сервис Skypro.Music",
};

// Корневой layout компонент - обертка для всех страниц приложения
// children - это содержимое конкретной страницы, которое будет отрендерено
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      {/* Применяем шрифт Montserrat через CSS переменную */}
      <body className={montserrat.variable}>
        {children}
      </body>
    </html>
  );
}
