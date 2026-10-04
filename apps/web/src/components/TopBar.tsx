"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";

export interface TopBarProps {
  compact?: boolean;
}

export function TopBar({ compact = false }: TopBarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Verify" },
    { href: "/how-it-works", label: "How it Works" },
    { href: "/checks", label: "My Checks" },
  ];

  return (
    <header className={`sticky top-0 z-40 w-full backdrop-blur-[12px] bg-surface/80 border-b border-outline-variant/30 ${compact ? 'h-[64px]' : 'h-[80px]'}`}>
      <div className="mx-auto max-w-[var(--spacing-container-max)] px-[var(--spacing-margin-mobile)] lg:px-[var(--spacing-margin-desktop)] h-full flex items-center justify-between">
        
        {/* Brand */}
        <Link 
          href="/" 
          className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-[var(--radius-control)]"
          aria-label="RecruitShield AI Home"
        >
          <Icon name="shield_person" filled className="text-primary" size={32} />
          <span className="font-bold text-[var(--text-h3-desktop)] leading-[var(--text-h3-desktop--line-height)]">
            RecruitShield AI
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[var(--text-button)] font-semibold h-full flex items-center border-b-2 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-[var(--radius-control)] ${
                  isActive 
                    ? "text-primary border-primary" 
                    : "text-on-surface hover:text-primary border-transparent"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Hamburger */}
        <button
          type="button"
          className="md:hidden p-2 text-on-surface hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-[var(--radius-control)]"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon name={menuOpen ? "close" : "menu"} size={24} />
        </button>
      </div>

      {/* Mobile Menu Sheet */}
      {menuOpen && (
        <div 
          id="mobile-menu"
          className="absolute top-full left-0 w-full bg-surface-container-high border-b border-outline-variant/30 md:hidden shadow-[var(--shadow-level-2)]"
        >
          <nav aria-label="Mobile Navigation" className="flex flex-col p-4 gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[var(--text-button)] font-semibold p-4 rounded-[var(--radius-control)] ${
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-on-surface hover:text-primary hover:bg-surface-container-highest"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
