"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'For Crew', href: '/for-crew' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Career Support', href: '/career-support' },
  { label: 'For Employers', href: '/for-employers' },
  { label: 'About Us', href: '/about-us' }
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Handle body scroll locking and escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      const handleEscape = (e) => {
        if (e.key === 'Escape') setIsOpen(false);
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  return (
    <header className="absolute top-0 left-0 right-0 z-[60] flex items-center justify-between px-6 py-5 lg:px-12 bg-transparent pointer-events-none">
      
      {/* Brand (pointer-events-auto so it's clickable despite wrapper) */}
      <Link href="/" className="flex items-center gap-3 relative z-[70] press pointer-events-auto" onClick={() => setIsOpen(false)}>
        <Image src="/logo.png" alt="CrewApply Logo" width={40} height={40} className="object-contain drop-shadow-sm" />
        <span className="text-xl font-extrabold text-heading tracking-tight drop-shadow-sm">CrewApply</span>
      </Link>

      {/* Desktop Nav Links */}
      <nav className="hidden lg:flex items-center gap-8 bg-glass px-8 py-3.5 rounded-pill shadow-sm border border-white/40 pointer-events-auto">
        {NAV_LINKS.map((link) => (
          <Link 
            key={link.href} 
            href={link.href} 
            className={`text-sm font-bold transition-colors press ${
              pathname === link.href ? 'text-primary' : 'text-heading hover:text-primary'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Desktop Actions */}
      <div className="hidden lg:flex items-center gap-5 relative z-10 pointer-events-auto">
        <Link href="/login" className="px-5 py-2.5 text-sm font-bold text-heading hover:text-primary transition-colors press drop-shadow-sm">
          Login
        </Link>
        <Link href="/signup" className="px-7 py-3 bg-primary text-white text-sm font-bold rounded-pill shadow-md hover:bg-primary-dark transition-colors press">
          Get Started
        </Link>
      </div>

      {/* Mobile Menu Trigger & Get Started */}
      <div className="flex items-center gap-4 lg:hidden relative z-[70] pointer-events-auto">
        {/* Only show Get Started pill in header when drawer is closed to keep it clean when open */}
        <div className={`transition-opacity duration-200 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <Link href="/signup" className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-pill shadow-sm hover:bg-primary-dark transition-colors press">
            Get Started
          </Link>
        </div>
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          className="text-heading w-10 h-10 press bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-white/40 flex items-center justify-center transition-transform"
        >
          {isOpen ? <Icon name="times" size={20} /> : <Icon name="bars" size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[50] transition-opacity duration-300 lg:hidden pointer-events-auto ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div 
        className={`fixed top-0 right-0 bottom-0 w-[85vw] max-w-[400px] bg-white/95 backdrop-blur-md shadow-2xl border-l border-line-soft z-[55] p-6 pt-24 flex flex-col transition-transform duration-300 ease-in-out lg:hidden pointer-events-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto no-scrollbar">
          {NAV_LINKS.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              onClick={() => setIsOpen(false)}
              className={`py-3 px-4 rounded-xl text-base font-semibold transition-colors ${
                pathname === link.href 
                  ? 'text-primary bg-primary/10' 
                  : 'text-heading hover:text-primary hover:bg-surface'
              }`}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="border-t border-line-soft my-6 mx-4"></div>
          
          <div className="flex flex-col gap-3 px-4 pb-8">
            <Link 
              href="/login" 
              onClick={() => setIsOpen(false)}
              className="py-3.5 text-center text-base font-bold text-heading border-2 border-line-soft rounded-pill hover:bg-surface hover:border-line-hard transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/signup" 
              onClick={() => setIsOpen(false)}
              className="py-3.5 text-center text-base font-bold text-white bg-primary rounded-pill hover:bg-primary-dark shadow-sm transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
