import React from 'react';

export default function TrackingView({ orderStatus, trackingError, setView, setIsTracking }) {
  const isDelivered = orderStatus === 'Delivered';

  return (
    <div className="min-h-[calc(100vh-25rem)] flex flex-col justify-start w-full">
      <div className="p-8 md:p-12 bg-background-surface rounded-[16px] text-center max-w-[480px] mx-auto my-12 shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover">
        <h3 className="m-[0_0_0.5rem_0] text-[1.4rem] font-bold tracking-normal text-white">📦 Order Progress</h3>
        <p className="text-slateText-muted mt-0 text-[1.05rem] leading-[1.65]">
          This demo order is stored without payment or delivery details. Status updates arrive in real time.
        </p>
        {trackingError && <p role="alert" className="text-red-300 text-sm">{trackingError}</p>}
        <div className={`p-6 rounded-[12px] my-8 transition-all duration-200 ${isDelivered ? 'bg-accent-success' : 'bg-accent-danger'}`}>
          <span className={`text-[0.85rem] font-bold tracking-wider block uppercase ${isDelivered ? 'text-accent-successText' : 'text-accent-dangerText'}`}>
            Current Tracker State
          </span>
          <strong className={`text-[2.25rem] block mt-2 tracking-tight capitalize ${isDelivered ? 'text-accent-successText' : 'text-accent-dangerText'}`}>
            {orderStatus}
          </strong>
        </div>
        <button 
          type="button"
          className="w-full py-[0.55rem] bg-accent-primary text-background border-0 rounded-[6px] text-[0.85rem] font-bold font-sans cursor-pointer shadow-flat-btn transition-all duration-200 hover:bg-accent-light focus-visible:ring-2 focus-visible:ring-accent-primary/20 focus-visible:shadow-subtle-focus outline-none mb-3" 
          onClick={() => setView('admin')} 
        >
          Kitchen Admin Panel
        </button>
        <button 
          type="button"
          className="w-full py-[0.55rem] text-[0.85rem] font-sans font-semibold rounded-[6px] border-0 outline-none cursor-pointer transition-all duration-200 bg-white/5 text-white hover:bg-white/10 active:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/20" 
          onClick={() => { 
            setView('dashboard'); 
            setIsTracking(false); 
          }}
        >
          Return & Reset Dashboard
        </button>
      </div>
    </div>
  );
}
