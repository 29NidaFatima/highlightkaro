import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

const TONES = {
  cyan: "from-cyan-400 to-blue-600 text-white shadow-[0_16px_36px_-12px_rgba(6,182,212,0.8)]",
  green: "from-emerald-400 to-emerald-600 text-white shadow-[0_16px_36px_-12px_rgba(16,185,129,0.8)]",
  amber: "from-amber-300 to-amber-500 text-white shadow-[0_16px_36px_-12px_rgba(245,158,11,0.7)]",
  red: "from-rose-400 to-red-600 text-white shadow-[0_16px_36px_-12px_rgba(239,68,68,0.7)]",
};

/**
 * Centered single-card layout for payment status screens.
 */
export default function StatusShell({ icon, tone = "cyan", title, children, pulse = false }) {
  const navigate = useNavigate();

  return (
    <div className="hk-page flex flex-col">
      <header className="relative z-10 mx-auto flex w-full max-w-6xl px-4 py-5">
        <Logo onClick={() => navigate("/")} />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="hk-glass w-full max-w-md animate-fade-up p-8 text-center sm:p-10">
          {icon && (
            <div className="mb-6 flex justify-center">
              <span className={`relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${TONES[tone]}`}>
                {pulse && <span className="absolute inset-0 animate-ping rounded-2xl bg-current opacity-20" />}
                {icon}
              </span>
            </div>
          )}
          {title && <h1 className="text-[28px] font-bold leading-tight text-gray-900">{title}</h1>}
          {children}
        </div>
      </main>
    </div>
  );
}
