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
    <nav className="fixed bottom-0 w-full glass border-t border-gray-800 md:top-0 md:bottom-auto md:border-t-0 md:border-b z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-around md:justify-end md:gap-8">
        {/* Logo for desktop */}
        <div className="hidden md:flex flex-1 items-center">
          <Link href="/">
            <span className="text-xl font-bold gradient-text">Calorie-Tracker</span>
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
                  'flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-xl transition-all',
                  isActive
                    ? 'text-cyan-400 bg-cyan-400/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                )
              )}
            >
              <Icon className={clsx('w-5 h-5', isActive ? 'text-cyan-400' : 'text-gray-400')} />
              <span className="text-xs md:text-sm font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
