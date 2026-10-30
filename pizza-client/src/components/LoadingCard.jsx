export default function LoadingCard() {
  return (
    <div className="w-full text-left relative mb-16">
      <div 
        className="w-full bg-background-surface rounded-[16px] shadow-flat-card flex flex-col justify-start items-center h-[580px] md:h-[580px] pt-[123px] md:pt-0 md:justify-center px-6 box-border"
        role="status"
      >
        <div className="flex flex-col gap-2 text-center select-none animate-pulse font-mono">
          <span className="text-[1.1rem] text-accent-primary font-normal tracking-[0.05em]">
            Spinning Up Web Service
          </span>
          <span className="text-[0.9rem] text-slateText-muted font-normal tracking-[0.02em]">
            (Please allow up to 60 seconds)
          </span>
        </div>
      </div>
    </div>
  );
}
