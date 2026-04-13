export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] w-full">
      <div className="flex flex-col items-center gap-4">
        {/* Animated logo mark */}
        <div className="relative flex items-center gap-1">
          {/* Three bars that animate like a waveform */}
          {[0.6, 1, 0.75].map((h, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-[#E8311A]"
              style={{
                height: `${h * 28}px`,
                animation: `huat-bar 0.9s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>

        {/* Brand name */}
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-[#E8311A] font-black text-xl tracking-tighter leading-none"
            style={{ animation: "huat-fade 0.9s ease-in-out infinite" }}
          >
            Huat
          </span>
          <span
            className="text-[#E8311A] font-black text-xl"
            style={{ animation: "huat-fade 0.9s ease-in-out infinite", animationDelay: "0.15s" }}
          >
            发
          </span>
        </div>
      </div>

      <style>{`
        @keyframes huat-bar {
          0%, 100% { transform: scaleY(0.4); opacity: 0.4; }
          50%       { transform: scaleY(1);   opacity: 1;   }
        }
        @keyframes huat-fade {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
