import { useEffect, useState } from "react";
import { subscribeToast } from "../utils/toast";

const typeStyles = {
  success: "bg-white/90 border-green-200 text-gray-700 dark:bg-gray-900/90 dark:border-yellow-500/20 dark:text-gray-300",
  error: "bg-white/90 border-red-200 text-gray-700 dark:bg-gray-900/90 dark:border-yellow-500/20 dark:text-gray-300",
  info: "bg-white/90 border-cyan-200 text-gray-700 dark:bg-gray-900/90 dark:border-yellow-500/20 dark:text-gray-300",
};

const accent = {
  success: "text-green-600",
  error: "text-red-600",
  info: "text-cyan-600",
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
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-[280px] max-w-sm rounded-xl border shadow-xl backdrop-blur-md px-4 py-3 flex items-start gap-3 transform transition-all duration-300 translate-y-0 ${typeStyles[t.type]}`}
          >
            <div className={`mt-0.5 ${accent[t.type]}`}>●</div>
            <div className="flex-1 text-sm leading-5">{t.message}</div>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-2 text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
