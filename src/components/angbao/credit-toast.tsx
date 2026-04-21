"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { formatAngBao, ANGBAO_REASONS } from "@/lib/angbao";
import { playMessageSound } from "@/lib/sounds";

interface ToastItem {
  id: number;
  amount: number;
  reason: string;
  showEducation: boolean;
}

interface AngBaoToastContextValue {
  showCredit: (reason: string, amount: number) => void;
  balance: number;
}

const AngBaoToastContext = createContext<AngBaoToastContextValue>({
  showCredit: () => {},
  balance: 0,
});

export function useAngBaoToast() {
  return useContext(AngBaoToastContext);
}

const SEEN_KEY = "angbao_toast_seen";
const EDUCATION_THRESHOLD = 10;

function getSeenCount(): number {
  try { return parseInt(localStorage.getItem(SEEN_KEY) ?? "0", 10); } catch { return 0; }
}

function incrementSeen() {
  try { localStorage.setItem(SEEN_KEY, String(getSeenCount() + 1)); } catch { /* */ }
}

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  angle: (i * 30) * (Math.PI / 180),
  distance: 60 + Math.random() * 40,
  size: 4 + Math.random() * 4,
  delay: Math.random() * 200,
  color: ["#E8311A", "#FFD700", "#FF6B35", "#22C55E", "#E8311A", "#FFD700"][i % 6],
}));

export function AngBaoToastProvider({ children, initialBalance = 0 }: { children: React.ReactNode; initialBalance?: number }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [nextId, setNextId] = useState(0);
  const [balance, setBalance] = useState(initialBalance);

  const showCredit = useCallback((reason: string, amount: number) => {
    const seen = getSeenCount();
    incrementSeen();
    const id = nextId;
    setNextId(n => n + 1);
    setBalance(b => b + amount);
    setToasts(prev => [...prev, { id, amount, reason, showEducation: seen < EDUCATION_THRESHOLD }]);
    playMessageSound();
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, [nextId]);

  return (
    <AngBaoToastContext.Provider value={{ showCredit, balance }}>
      {children}
      {toasts.map(toast => (
        <AngBaoToastOverlay key={toast.id} toast={toast} />
      ))}
    </AngBaoToastContext.Provider>
  );
}

function AngBaoToastOverlay({ toast }: { toast: ToastItem }) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");
  const info = ANGBAO_REASONS[toast.reason];

  useEffect(() => {
    requestAnimationFrame(() => setPhase("visible"));
    const exitTimer = setTimeout(() => setPhase("exit"), 4200);
    return () => clearTimeout(exitTimer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
      style={{ perspective: "800px" }}
    >
      {/* Backdrop pulse */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: phase === "visible" ? 1 : 0,
          background: "radial-gradient(circle at center, rgba(232,49,26,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Confetti particles */}
      {phase === "visible" && PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            left: "50%",
            top: "50%",
            animation: `angbao-particle 800ms ease-out ${p.delay}ms forwards`,
            "--px": `${Math.cos(p.angle) * p.distance}px`,
            "--py": `${Math.sin(p.angle) * p.distance}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Card */}
      <div
        className="transition-all"
        style={{
          transform: phase === "enter"
            ? "scale(0.3) translateY(20px)"
            : phase === "exit"
            ? "scale(0.8) translateY(-10px)"
            : "scale(1) translateY(0)",
          opacity: phase === "enter" ? 0 : phase === "exit" ? 0 : 1,
          transitionDuration: phase === "exit" ? "400ms" : "500ms",
          transitionTimingFunction: phase === "exit" ? "ease-in" : "cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div className="bg-[#1A1A1A] border border-[#E8311A]/40 rounded-2xl shadow-2xl shadow-[#E8311A]/10 px-8 py-6 text-center min-w-[280px] max-w-[320px]">
          {/* Envelope icon with bounce */}
          <div
            className="text-5xl mb-3"
            style={{
              animation: phase === "visible" ? "angbao-bounce 600ms cubic-bezier(0.34, 1.56, 0.64, 1)" : undefined,
            }}
          >
            🧧
          </div>

          {/* Amount */}
          <div
            className="text-3xl font-black text-[#22C55E] mb-1 tabular-nums"
            style={{
              animation: phase === "visible" ? "angbao-amount 400ms ease-out 200ms both" : undefined,
            }}
          >
            +{formatAngBao(toast.amount)}
          </div>

          <p className="text-sm font-semibold text-[#E8311A] mb-3">AngBao Earned!</p>

          {/* Reason */}
          <p className="text-sm text-[#9CA3AF]">
            {info?.emoji} {info?.label ?? toast.reason}
          </p>

          {/* Education text */}
          {toast.showEducation && (
            <p className="text-xs text-[#555555] mt-4 leading-relaxed border-t border-[#282828] pt-3">
              AngBao (红包) is your social currency on Huat.
              <br />
              Earn more by posting, reacting, and engaging!
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes angbao-bounce {
          0% { transform: scale(0.5); }
          50% { transform: scale(1.3); }
          75% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes angbao-amount {
          0% { opacity: 0; transform: scale(0.5) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes angbao-particle {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--px)), calc(-50% + var(--py))) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
