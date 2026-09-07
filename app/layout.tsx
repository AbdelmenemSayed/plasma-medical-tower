import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'برج بلازما الطبي | رعاية متكاملة',
  description: 'منصة برج بلازما الطبي للحجز وإدارة الرعاية الصحية في الحوامدية.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
