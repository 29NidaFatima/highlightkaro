import { useNavigate } from "react-router-dom";
import { Check, Highlighter } from "lucide-react";
import Logo from "./Logo";

const PERKS = [
  "Draw highlights on any image",
  "5 smooth, CapCut-style animations",
  "Export crisp MP4 in seconds",
];

/**
 * Two-column auth screen: brand showcase on the left (desktop only), form card on the right.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  const navigate = useNavigate();

  return (
    <div className="hk-page flex">
      {/* Showcase */}
      <aside className="relative z-10 hidden w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-blue-900/30 blur-3xl" />

        <button onClick={() => navigate("/")} className="relative flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur">
            <Highlighter size={20} strokeWidth={2.4} />
          </span>
          <span className="font-display text-2xl font-extrabold tracking-tight">HighlightKaro</span>
        </button>

        <div className="relative">
          <h2 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight">
            Make every
            <br />
            word{" "}
            <span className="relative inline-block">
              <span
                className="absolute inset-x-[-6px] bottom-1 top-2 origin-left animate-sweep rounded-md bg-yellow-300/90"
                aria-hidden
              />
              <span className="relative text-gray-950">pop.</span>
            </span>
          </h2>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-cyan-50/90">
            Turn screenshots, notes and articles into scroll-stopping highlight videos for Reels, Shorts and stories.
          </p>
          <ul className="mt-8 space-y-3">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm font-medium">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20 ring-1 ring-white/30">
                  <Check size={14} strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-cyan-50/70">© {new Date().getFullYear()} HighlightKaro</p>
      </aside>

      {/* Form */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px] animate-fade-up">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo onClick={() => navigate("/")} />
          </div>
          <div className="hk-glass p-7 sm:p-8">
            <h1 className="text-[28px] font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>}
            <div className="mt-7">{children}</div>
          </div>
          {footer && <div className="mt-6 text-center text-sm text-gray-600">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
