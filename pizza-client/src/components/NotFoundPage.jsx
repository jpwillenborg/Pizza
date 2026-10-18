import React from 'react';

export default function NotFoundPage() {
  return (
    <>
      <section className="px-6 sm:px-8 md:px-[40px] lg:px-6 pb-0 pt-[125px] md:pt-[140px] lg:pt-[160px] relative z-10">
        <div className="max-w-[960px] mx-auto text-left w-full">
          <div className="mb-7 md:mb-10 text-left">
            <span className="text-[0.95rem] md:text-[1.1rem] font-mono text-accent-primary block mb-1 font-normal -mt-0.5">
              // Signal Lost
            </span>
            <h1 className="text-[1.65rem] md:text-[2.1rem] font-semibold tracking-wide text-white m-0 leading-tight">
              Route Disappeared
            </h1>
          </div>
        </div>
      </section>

      <section className="px-6 sm:px-8 md:px-[40px] lg:px-6 pt-0 pb-16 relative z-10">
        <div className="max-w-[960px] mx-auto w-full">
          <div className="bg-background-surface rounded-[16px] p-5 md:p-12 shadow-flat-card text-center flex flex-col items-center py-12 md:py-16">
            
            <div className="relative w-full max-w-[200px] h-[220px] flex flex-col items-center justify-start select-none mb-4">
              <svg 
                className="w-32 h-auto text-accent-primary fill-current drop-shadow-[0_0_15px_rgba(0,229,255,0.4)] animate-bounce" 
                style={{ animationDuration: '3s' }}
                viewBox="0 0 100 50"
              >
                <path d="M35,22 C35,12 65,12 65,22 Z" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M15,30 C5,30 5,22 50,22 C95,22 95,30 85,30 Z" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="30" cy="26" r="1.5" className="animate-pulse" />
                <circle cx="50" cy="27" r="1.5" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
                <circle cx="70" cy="26" r="1.5" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
              </svg>

              <div 
                className="w-24 bg-gradient-to-b from-accent-primary/40 via-accent-primary/10 to-transparent absolute top-[28px]"
                style={{ 
                  height: '140px',
                  clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)'
                }}
              />

              <div className="absolute top-[75px] font-mono text-5xl font-extrabold text-white/80 tracking-widest animate-pulse pointer-events-none">
                404
              </div>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl mt-2">
              Abducted by Unidentified Anomalous Phenomena
            </h2>
            
            <p className="m-0 text-slateText-muted text-[1.05rem] leading-[1.65] max-w-md mt-4 text-center">
              The subpath or data transmission route you are tracking has vanished from radar. It may have been pulled into the upper atmosphere.
            </p>

            <div className="mt-8 flex items-center justify-center w-full md:w-auto">
              <a href="/" className="inline-flex items-center justify-center whitespace-nowrap font-sans font-semibold text-[0.95rem] rounded-[6px] px-7 py-2.5 bg-accent-primary text-background transition-all duration-200 no-underline text-center cursor-pointer hover:bg-accent-primary/75 active:bg-accent-primary/60">
                Return Home
              </a>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
