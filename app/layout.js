import './globals.css';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/Toast';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { ThemeProvider } from '@/context/ThemeContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata = {
  title: 'AVADH15 — Virtual Trading',
  description: "India's biggest virtual exchange",
};

// Inline script runs before paint to avoid theme flash on reload
const themeScript = `
try {
  var s = localStorage.getItem('avadh15_theme');
  var dark = s ? s === 'dark' : !window.matchMedia('(prefers-color-scheme: light)').matches;
  document.documentElement.classList.add(dark ? 'dark' : 'light');
} catch (e) {
  document.documentElement.classList.add('dark');
}
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrains.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-bg text-fg">
        <ThemeProvider>
          <AuthProvider>
            <NotificationsProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </NotificationsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
