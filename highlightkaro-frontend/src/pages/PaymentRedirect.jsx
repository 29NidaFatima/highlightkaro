import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50 px-4 relative overflow-hidden">
      {/* Animated background blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-sm w-full">
        {/* Floating glow effects */}
        <div className="absolute -top-3 -right-3 w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-3 -left-3 w-24 h-24 bg-gradient-to-br from-blue-400 to-sky-400 rounded-full blur-2xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="bg-white/90 backdrop-blur-md border border-cyan-200 rounded-2xl shadow-xl overflow-hidden relative">
          {/* Decorative top gradient bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
          
          <div className="p-8 text-center">
            {/* Success checkmark icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full mb-4 shadow-lg animate-bounce">
              <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-2">
              You are upgrading to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 capitalize">{plan}</span>
            </h2>

            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-4 mb-6 border border-cyan-100 shadow-inner relative overflow-hidden">
              {/* Subtle inner glow */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-200 rounded-full blur-2xl opacity-30"></div>
              <p className="text-3xl font-bold text-gray-900 relative">
                {currency === "INR" ? "₹" : currency} {amount}
                <span className="text-sm font-normal text-gray-500 ml-1">/{billingCycle}</span>
              </p>
              <p className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No hidden charges • Cancel anytime
              </p>
            </div>

            <div className="flex flex-col items-center justify-center mb-6 space-y-3">
              {/* Enhanced spinner */}
              <div className="relative">
                <div className="w-12 h-12 border-4 border-cyan-200 rounded-full"></div>
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              
              <p className="text-sm font-medium text-gray-600 animate-pulse">
                Redirecting you to secure payment...
              </p>

              {/* Progress bar */}
              <div className="w-full px-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-center w-5 h-5 bg-green-100 rounded-full">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Secure payment powered by</span>
              <span className="font-bold text-cyan-600">Razorpay</span>
            </div>
          </div>

          {/* Bottom accent bar */}
          <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-sky-500"></div>
        </div>
      </div>
    </div>
  );
}