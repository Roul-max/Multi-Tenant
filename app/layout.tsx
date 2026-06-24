import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NotesFlow',
  description: 'A multi-tenant SaaS workspace for team notes and knowledge management',
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
