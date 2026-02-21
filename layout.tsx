// app/layout.tsx - CLEAN VERSION
import { NotificationBell } from './components/NotificationBell';
import { AppProviders } from './notification-providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}