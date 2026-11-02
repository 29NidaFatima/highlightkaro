import { useEffect, useState } from "react";
import { CircleCheck, CircleAlert, Info, X } from "lucide-react";
import { subscribeToast } from "../utils/toast";

const ICONS = {
  success: <CircleCheck size={18} className="text-emerald-500" />,
  error: <CircleAlert size={18} className="text-rose-500" />,
  info: <Info size={18} className="text-cyan-500" />,
};

const BARS = {
  success: "bg-emerald-400",
  error: "bg-rose-400",
  info: "bg-cyan-400",
};

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsub = subscribeToast((toast) => {
      setToasts((prev) => [toast, ...prev].slice(0, 5));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    });
    return unsub;
  }, []);

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-2.5 sm:left-auto sm:right-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto relative flex w-full max-w-sm animate-fade-up items-start gap-3 overflow-hidden rounded-2xl border border-white/70 bg-white/90 py-3 pl-4 pr-2 text-gray-700 shadow-[0_16px_40px_-16px_rgba(8,47,73,0.35)] backdrop-blur-xl"
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${BARS[t.type] || BARS.info}`} />
            <span className="mt-px">{ICONS[t.type] || ICONS.info}</span>
            <p className="flex-1 text-sm leading-5">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
