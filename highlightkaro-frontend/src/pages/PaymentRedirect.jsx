import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function PaymentRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const { paymentLink, plan, amount, currency, billingCycle } = location.state || {};

  useEffect(() => {
    if (!paymentLink) {
      // If accessed directly without state, go back to upgrade
      navigate("/upgrade");
      return;
    }

    const timer = setTimeout(() => {
      window.location.href = paymentLink;
    }, 1500);

    return () => clearTimeout(timer);
  }, [paymentLink, navigate]);

  if (!paymentLink) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50 px-4">
      <div className="bg-white/90 backdrop-blur-md border border-cyan-200 rounded-2xl shadow-xl p-8 max-w-sm w-full text-center relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
        
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          You are upgrading to <span className="text-cyan-600 capitalize">{plan}</span>
        </h2>

        <div className="bg-cyan-50 rounded-lg p-4 mb-6 border border-cyan-100">
          <p className="text-3xl font-bold text-gray-900">
            {currency === "INR" ? "₹" : currency} {amount}
            <span className="text-sm font-normal text-gray-500 ml-1">/{billingCycle}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            No hidden charges • Cancel anytime
          </p>
        </div>

        <div className="flex flex-col items-center justify-center mb-6 space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-600 animate-pulse">
            Redirecting you to secure payment...
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 border-t pt-4">
          <span>🔒 Secure payment powered by</span>
          <span className="font-bold text-gray-500">Razorpay</span>
        </div>
      </div>
    </div>
  );
}
