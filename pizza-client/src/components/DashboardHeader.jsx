import React from 'react';

export default function DashboardHeader({ view, isTracking, setView }) {
  return (
    <div className="flex flex-col pb-6 mb-10">
      <div className="text-left w-full">
        <span className="text-[1.1rem] font-mono text-accent-primary block mb-0 font-normal">// Ordering System</span>
        <h1 className="text-[2.1rem] font-semibold tracking-normal text-white m-0 pt-1 leading-tight">Full-Stack Pizza Delivery</h1>
        <p className="text-slateText-muted text-[1.05rem] leading-[1.65] mt-10 mb-16 block w-full">
          A interactive demo ordering workflow featuring a React and Vite frontend on Apache coupled with an Express API hosted on Render. The server validates pricing securely, logs simulated orders into MySQL, and streams instantaneous, order-specific status updates via Socket.IO. This sandbox environment does not collect delivery details or process payments.
        </p>
      </div>

      <div className="flex gap-3 justify-start items-center w-full">
        <button 
          onClick={() => setView(isTracking ? 'tracking' : 'dashboard')} 
          className={`px-[1.25rem] py-[0.55rem] text-[0.85rem] font-bold font-sans rounded-[6px] border-0 cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20 ${
            view === 'dashboard' || view === 'tracking' 
              ? 'bg-accent-primary text-background' 
              : 'bg-white/5 text-white hover:bg-white/12'
          }`}
        >
          Customer Portal
        </button>
        <button 
          onClick={() => setView('admin')} 
          className={`px-[1.25rem] py-[0.55rem] text-[0.85rem] font-bold font-sans rounded-[6px] border-0 cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20 ${
            view === 'admin' 
              ? 'bg-accent-primary text-background' 
              : 'bg-white/5 text-white hover:bg-white/12'
          }`}
        >
          Kitchen Admin
        </button>
      </div>
    </div>
  );
}
