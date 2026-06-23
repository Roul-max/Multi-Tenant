import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notes App',
  description: 'A production-ready multi-tenant notes application with subscription management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
