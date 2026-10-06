import React from 'react';

export default function TrackingView({ orderStatus, trackingError, setView, setIsTracking }) {
  const getStepStatusClass = (currentStage, targetStage) => {
    const stages = ['Received', 'Preparing', 'Baking', 'Out for Delivery', 'Delivered'];
    const currentIndex = stages.indexOf(currentStage);
    const targetIndex = stages.indexOf(targetStage);

    if (currentIndex >= targetIndex) {
      return 'border-accent-primary text-white bg-accent-primary/25';
    }
    return 'text-slateText-muted bg-background';
  };

  const getLineStatusClass = (currentStage, targetStage) => {
    const stages = ['Received', 'Preparing', 'Baking', 'Out for Delivery', 'Delivered'];
    const currentIndex = stages.indexOf(currentStage);
    const targetIndex = stages.indexOf(targetStage);

    if (currentIndex >= targetIndex) {
      return 'bg-accent-primary';
    }
    return 'bg-white/10';
  };

  return (
    <div className="max-w-[720px] mx-auto bg-background-surface mb-24 p-6 md:p-10 rounded-[16px] shadow-flat-card text-left md:mt-[52px] w-full box-border md:min-h-[820px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-white/[0.04] pb-6 flex-wrap">
        <div>
          <h3 className="mt-0 mb-1 text-[1.4rem] font-bold text-white flex items-center gap-2.5">
            <span>🍕</span> Live Order Tracker
          </h3>
          <p className="m-0 text-slateText-muted text-sm leading-relaxed">
            Your receipt token is active. Status updates are streaming in real-time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsTracking(false);
            setView('dashboard');
          }}
          className="p-[0.55rem_1rem] text-[0.85rem] font-bold rounded-[6px] cursor-pointer transition-colors duration-150 outline-none border-0 focus-visible:ring-2 focus-visible:ring-white/20 bg-white/5 text-white hover:bg-white/10 active:bg-white/20"
        >
          New Order
        </button>
      </div>

      {trackingError && (
        <p role="alert" className="text-red-300 text-sm mb-6 bg-red-500/10 p-4 rounded-[6px] border border-red-500/20 font-mono">
          {trackingError}
        </p>
      )}

      <div className="flex flex-col gap-0 relative w-full box-border pl-4 sm:pl-0">
        {[
          { stage: 'Received', label: 'Order Received', desc: 'The kitchen has confirmed your demo request.' },
          { stage: 'Preparing', label: 'Preparing Dough', desc: 'Hand-stretching base crust layers inside the sandbox.' },
          { stage: 'Baking', label: 'Oven Baking', desc: 'Firing ingredients at maximum temperature lines.' },
          { stage: 'Out for Delivery', label: 'Out for Delivery', desc: 'Simulated dispatch router transit loop active.' },
          { stage: 'Delivered', label: 'Delivered', desc: 'Transaction complete. Fictional logs saved to history.' }
        ].map((step, index, arr) => {
          const isLast = index === arr.length - 1;
          const cardClass = getStepStatusClass(orderStatus, step.stage);
          const lineClass = getLineStatusClass(orderStatus, arr[index + 1]?.stage);

          return (
            <div key={step.stage} className="flex gap-6 items-center relative min-h-[90px] last:min-h-0 mb-6 last:mb-0">
              <div className="flex flex-col items-center flex-shrink-0 relative h-full justify-center">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono font-bold text-sm transition-all duration-300 z-10 bg-background-surface ${cardClass}`}>
                  {index + 1}
                </div>
                {!isLast && (
                  <div className={`w-[2px] h-[82px] absolute top-8 transition-all duration-300 left-1/2 -translate-x-1/2 ${lineClass}`} />
                )}
              </div>

              <div className={`flex-grow p-4 rounded-[12px] border border-transparent transition-all duration-300 ${cardClass}`}>
                <h4 className="mt-0 mb-1 text-[1.05rem] font-bold tracking-wide">{step.label}</h4>
                <p className="m-0 text-slateText-muted text-[0.88rem] leading-relaxed opacity-85">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
