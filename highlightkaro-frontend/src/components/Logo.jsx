import { Highlighter } from "lucide-react";

/**
 * Brand mark + wordmark. `dark` switches to the yellow dark-mode palette.
 */
export default function Logo({ dark = false, size = "md", showTagline = false, onClick }) {
  const box = size === "sm" ? "h-8 w-8 rounded-xl" : "h-10 w-10 rounded-2xl";
  const icon = size === "sm" ? 16 : 20;
  const text = size === "sm" ? "text-lg" : "text-xl sm:text-2xl";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-3 text-left ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <span
        className={`relative grid place-items-center ${box} transition-transform duration-300 group-hover:-rotate-6 ${
          dark
            ? "bg-gradient-to-br from-yellow-300 to-amber-500 text-gray-950 shadow-[0_8px_24px_-8px_rgba(250,204,21,0.7)]"
            : "bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_8px_24px_-8px_rgba(6,182,212,0.8)]"
        }`}
      >
        <Highlighter size={icon} strokeWidth={2.4} />
      </span>
      <span className="leading-tight">
        <span className={`block font-display font-extrabold tracking-tight ${text} ${dark ? "text-white" : "text-gray-900"}`}>
          Highlight<span className={dark ? "text-yellow-400" : "text-cyan-600"}>Karo</span>
        </span>
        {showTagline && (
          <span className={`hidden text-xs sm:block ${dark ? "text-gray-400" : "text-gray-500"}`}>
            CapCut-style highlight animations in seconds
          </span>
        )}
      </span>
    </button>
  );
}
