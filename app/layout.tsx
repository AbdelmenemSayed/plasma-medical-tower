import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo' });

export const metadata: Metadata = {
  title: 'برج بلازما الطبي | رعاية متكاملة',
  description: 'احجز كشفك في برج بلازما الطبي بالحوامدية. عيادات متخصصة، معامل، أشعة، ومتابعة طبية متكاملة.',
  icons: { icon: '/pmt-logo.jpeg', shortcut: '/pmt-logo.jpeg', apple: '/pmt-logo.jpeg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.variable}>{children}</body>
    </html>
  );
}
