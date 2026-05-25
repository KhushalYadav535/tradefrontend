import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/Toast';
import { NotificationsProvider } from '@/context/NotificationsContext';

export const metadata = {
  title: 'AVADH11 — Virtual Trading',
  description: "India's biggest virtual exchange",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-white font-body">
        <AuthProvider>
          <NotificationsProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
