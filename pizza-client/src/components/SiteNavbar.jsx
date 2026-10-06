import React, { useState, useEffect } from 'react';

export default function SiteNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasScrolledDown, setHasScrolledDown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolledDown(window.scrollY > 4);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    const closeOnDesktop = () => {
      if (window.matchMedia('(min-width: 1040px)').matches) setIsMobileMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnDesktop);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnDesktop);
    };
  }, [isMobileMenuOpen]);

  const PORTFOLIO_URL = import.meta.env.VITE_PORTFOLIO_URL || 'http://localhost:5173';

  const navItems = [
    { label: 'Overview', href: `${PORTFOLIO_URL}/#top` },
    { label: 'Tech Stack', href: `${PORTFOLIO_URL}/#stacks` },
    { label: 'Web Apps', href: `${PORTFOLIO_URL}/#apps` },
    { label: 'Game Dev', href: `${PORTFOLIO_URL}/#gamedev` },
    { label: '3D Modeling', href: `${PORTFOLIO_URL}/#modeling` },
    { label: "Let's Connect", href: `${PORTFOLIO_URL}/#contact` }
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 py-[1.25rem] bg-[#06090f] transition-colors duration-200 ease-in-out">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between w-full m-0">
            
            <div className="w-1/2 min-[1040px]:w-1/4 text-left">
              <a 
                href={`${PORTFOLIO_URL}/#top`} 
                className="text-[1.75rem] font-bold text-white no-underline tracking-tight inline-block lowercase font-sans cursor-pointer rounded-[4px] focus-ring"
              >
                john<span className="text-[#00e5ff]" aria-hidden="true">.</span>willenborg
              </a>
            </div>

            <div className="hidden min-[1040px]:flex min-[1040px]:w-1/2 justify-center items-center">
              <div className="flex gap-[2.75rem]">
                {navItems.slice(0, 5).map((item) => (
                  <a 
                    key={item.label} 
                    href={item.href} 
                    className="no-underline font-mono text-[#a0aec0] opacity-85 hover:text-[#00e5ff] hover:opacity-100 transition-all duration-200 text-[1.05rem] font-normal tracking-normal inline-block text-center rounded-[4px] focus-ring"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="w-1/2 min-[1040px]:w-1/4 text-right flex justify-end items-center">
              <a 
                href={`${PORTFOLIO_URL}/#contact`} 
                className="hidden min-[1040px]:block bg-[#00e5ff] text-[#090d16] font-sans font-medium text-[0.85rem] tracking-[0.01em] normal-case rounded-[6px] px-[1.25rem] py-[0.45rem] shadow-flat-btn no-underline hover:bg-[#66efff] transition-all duration-200 focus-ring" 
              >
                Let's Connect
              </a>
              <button 
                type="button"
                className="bg-transparent border-0 outline-none p-0 min-[1040px]:hidden text-[1.75rem] no-underline cursor-pointer rounded-[4px] focus-ring" 
                onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="pizza-mobile-nav"
                aria-label="Toggle mobile navigation menu"
              >
                <span className="text-[#a0aec0] opacity-85 hover:text-[#00e5ff] hover:opacity-100 transition-all duration-200">
                  {isMobileMenuOpen ? '✕' : '☰'}
                </span>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div id="pizza-mobile-nav" aria-label="Mobile navigation" className="fixed inset-0 w-full h-full z-40 flex flex-col justify-center items-start min-[1040px]:hidden bg-[#090d16] px-10">
          <div className="flex flex-col gap-5 border-l border-white/[0.04] pl-6 text-left">
            {navItems.map((item) => (
              <a 
                key={item.label} 
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="no-underline font-mono font-medium text-[1.25rem] md:text-[1.45rem] tracking-wide text-white/90 hover:text-[#00e5ff] transition-colors duration-200 rounded-[4px] focus-ring"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
