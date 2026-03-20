import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import lablogicLogo from '@/assets/lablogic-logo-transparent.png';

const navLinks = [
  { label: 'Home', to: '/landing' },
  { label: 'Features', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Contact', to: '/contact' },
];

export function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-500',
        scrolled
          ? 'bg-background/90 backdrop-blur-xl border-b border-border shadow-sm'
          : 'bg-white shadow-sm'
      )}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <Link to="/landing" className="flex items-center gap-2 group">
          <img
            src={lablogicLogo}
            alt="LabLogic"
            width={180}
            height={68}
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            className="h-10 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                'px-4 py-2 text-sm rounded-md transition-colors duration-200',
                location.pathname === l.to
                  ? 'text-foreground font-medium bg-secondary/60'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/register-lab">Get Started</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className={cn(
            'md:hidden p-2 transition-colors',
            scrolled ? 'text-foreground' : 'text-white'
          )}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-b border-border px-6 pb-4 space-y-1 shadow-lg">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'block px-4 py-2.5 rounded-md text-sm',
                location.pathname === l.to
                  ? 'bg-secondary font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/40'
              )}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register-lab">Get Started</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
