import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { ToastProvider } from './components/Toast';

export const metadata: Metadata = {
  title: 'SIDAZ - Subscription Management',
  description: 'SIDAZ - Subscription and Billing Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
