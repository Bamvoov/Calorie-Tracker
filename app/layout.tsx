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
      <body className={`${inter.className} min-h-screen selection:bg-[#c9f268]/50 overflow-x-hidden`}>
        <NavBar />
        <main className="w-full max-w-[1600px] mx-auto px-4 pt-4 pb-24 md:pt-24 md:pb-12 min-h-screen flex flex-col relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
