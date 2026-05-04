"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Utensils, User, CalendarDays } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function NavBar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/log-food', label: 'Log Food', icon: Utensils },
    { href: '/calendar', label: 'Calendar', icon: CalendarDays },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-[#eaf2e3] md:top-0 md:bottom-auto shadow-sm z-50">
      <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-around md:justify-end md:gap-8">
        {/* Logo for desktop */}
        <div className="hidden md:flex flex-1 items-center">
          <Link href="/">
            <span className="text-xl font-black text-[#264a22] tracking-tight">Calorie-Tracker</span>
          </Link>
        </div>

        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={twMerge(
                clsx(
                  'flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 py-2 rounded-full transition-all font-bold',
                  isActive
                    ? 'text-black bg-[#d2ded0]'
                    : 'text-[#264a22]/70 hover:text-[#264a22] hover:bg-[#d2ded0]/50'
                )
              )}
            >
              <Icon className={clsx('w-5 h-5', isActive ? 'text-black' : 'text-[#264a22]/70')} />
              <span className="text-[10px] md:text-sm">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
