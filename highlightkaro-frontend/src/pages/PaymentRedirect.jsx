import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, CreditCard } from "lucide-react";
import StatusShell from "../components/StatusShell";

export default function PaymentRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const { paymentLink, plan, amount, currency, billingCycle } = location.state || {};
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!paymentLink) {
      navigate("/upgrade");
      return;
    }

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 100 : prev + 2));
    }, 30);

    const timer = setTimeout(() => {
      window.location.href = paymentLink;
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [paymentLink, navigate]);

  if (!paymentLink) return null;

  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : `${currency} `;

  return (
    <StatusShell tone="cyan" pulse icon={<CreditCard size={28} strokeWidth={2.2} />} title={`Upgrading to ${plan}`}>
      <p className="mt-2 text-sm text-gray-500">Taking you to secure checkout…</p>

      <div className="mt-7 rounded-2xl bg-white/70 p-5 ring-1 ring-cyan-100">
        <p className="flex items-baseline justify-center gap-1.5">
          <span className="font-display text-5xl font-extrabold tracking-tight text-gray-900">
            {symbol}
            {amount}
          </span>
          <span className="text-sm text-gray-500">{billingCycle}</span>
        </p>
        <p className="mt-2 text-xs text-gray-500">One-time payment · 30 days · no auto-renewal</p>
      </div>

      <div className="mt-7 h-1.5 w-full overflow-hidden rounded-full bg-cyan-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
        <ShieldCheck size={15} className="text-emerald-500" />
        Secure payment powered by <span className="font-semibold text-gray-700">Razorpay</span>
      </p>

      <a href={paymentLink} className="mt-4 inline-block text-xs font-semibold text-cyan-700 hover:underline">
        Not redirected? Continue to payment
      </a>
    </StatusShell>
  );
}
