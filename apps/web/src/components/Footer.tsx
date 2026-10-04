import Link from "next/link";
import { Icon } from "./Icon";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-container-lowest py-8 md:py-12 border-t border-outline-variant/20">
      <div className="mx-auto max-w-[var(--spacing-container-max)] px-[var(--spacing-margin-mobile)] lg:px-[var(--spacing-margin-desktop)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon name="shield_person" filled className="text-primary" size={24} />
              <span className="font-bold text-[var(--text-h3-mobile)] text-on-surface">
                RecruitShield AI
              </span>
            </div>
            <p className="text-[var(--text-body-sm)] text-on-surface-variant">
              Protecting job seekers through transparency and AI
            </p>
          </div>

          <nav aria-label="Footer Navigation" className="flex flex-wrap gap-4 md:gap-6">
            {['Resources', 'Privacy Policy', 'Security', 'Terms of Service', 'Support'].map((label) => (
              <Link 
                key={label}
                href="#" 
                className="text-[var(--text-body-sm)] text-on-surface-variant hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-[var(--radius-control)]"
              >
                {label}
              </Link>
            ))}
          </nav>

        </div>
        
        <div className="mt-8 pt-8 border-t border-outline-variant/20 text-[var(--text-label-caps)] text-on-surface-variant flex justify-between uppercase">
          <span>&copy; {currentYear} RecruitShield AI</span>
        </div>
      </div>
    </footer>
  );
}
