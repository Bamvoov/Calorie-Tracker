import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NavBar } from '@/components/NavBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: ' Calorie Tracker',
  description: 'Track your daily calories .',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-[#0f1115] text-white selection:bg-cyan-500/30`}>
        <NavBar />
        <main className="max-w-4xl mx-auto px-4 pt-4 pb-24 md:pt-24 md:pb-12 min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
