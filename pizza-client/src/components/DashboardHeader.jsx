import React from 'react';

export default function DashboardHeader({ view, isTracking, setView }) {
  return (
    <div className="flex flex-col pb-4 mb-6 text-left">
      <div className="w-full">
        <span className="text-[0.95rem] md:text-[1.1rem] font-mono text-accent-primary block mb-0 font-normal">// Ordering System</span>
        <h1 className="text-[1.65rem] md:text-[2.1rem] font-semibold tracking-normal text-white m-0 pt-1 leading-tight">Full-Stack Pizza Delivery</h1>
        <p className="text-slateText-muted text-[0.95rem] md:text-[1.05rem] leading-[1.6] mt-4 mb-6 block w-full">
          An interactive demo ordering workflow featuring a React and Vite frontend on Apache coupled with an Express API hosted on Render. The server validates pricing securely, logs simulated orders into MySQL, and streams instantaneous, order-specific status updates via Socket.IO. This sandbox environment does not collect delivery details or process payments.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-start items-stretch sm:items-center w-full pt-1 md:mt-8">
        <button 
          onClick={() => setView('dashboard')} 
          className={`w-full sm:w-auto text-center px-5 py-3 text-[0.9rem] font-bold font-sans rounded-[6px] border-0 cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20 ${
            view === 'dashboard' 
              ? 'bg-accent-primary text-background' 
              : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          Customer Portal
        </button>

        <button 
          onClick={() => setView('admin')} 
          className={`w-full sm:w-auto text-center px-5 py-3 text-[0.9rem] font-bold font-sans rounded-[6px] border-0 cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20 ${
            view === 'admin' 
              ? 'bg-accent-primary text-background' 
              : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          Kitchen Admin
        </button>

        <button 
          disabled={!isTracking}
          onClick={() => isTracking && setView('tracking')} 
          className={`w-full sm:w-auto text-center px-5 py-3 text-[0.9rem] font-bold font-sans rounded-[6px] border-0 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20 ${
            view === 'tracking' 
              ? 'bg-accent-primary text-background' 
              : !isTracking
                ? 'bg-white/5 text-white/40 cursor-not-allowed opacity-40'
                : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          Order Tracker
        </button>
      </div>
    </div>
  );
}
