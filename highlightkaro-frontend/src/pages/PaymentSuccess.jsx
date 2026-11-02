import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Check, Clock, AlertTriangle } from "lucide-react";
import { confirmPaymentFromCallback } from "../api/paymentApi";

const PLAN_FEATURES = {
  basic30: [
    "Yellow + Red colors",
    "4 animations",
    "1080p export",
    "No watermark",
    "Legendary Dark Mode"
  ],
  pro99: [
    "All colors unlocked",
    "All animations",
    "1080p export",
    "No watermark",
    "Legendary Dark Mode",
    "Cloud save"
  ]
};

const PLAN_LABEL = { free: "Free", basic30: "Basic", pro99: "Pro" };

// Razorpay can take a few seconds to mark the link paid
const MAX_ATTEMPTS = 6;
const RETRY_MS = 3000;

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser, user, token } = useAuth();
  // verifying | success | pending | failed | login
  const [status, setStatus] = useState("verifying");
  const unmounted = useRef(false);

  // Runs once per visit; a token refresh mid-way must not restart or abort it
  useEffect(() => {
    unmounted.current = false;
    const params = new URLSearchParams(location.search);
    const linkStatus = params.get("razorpay_payment_link_status");
    const isGone = () => unmounted.current;

    const run = async () => {
      if (linkStatus && linkStatus !== "paid") {
        setStatus("failed");
        return;
      }
      if (!token) {
        // Webhook will still activate the plan; user just needs to log in to see it
        setStatus("login");
        return;
      }

      for (let attempt = 0; attempt < MAX_ATTEMPTS && !isGone(); attempt++) {
        try {
          const result = await confirmPaymentFromCallback(params, token);
          if (result?.ok) {
            await refreshUser();
            if (!isGone()) setStatus("success");
            return;
          }
          if (result?.status === "cancelled" || result?.status === "expired") {
            if (!isGone()) setStatus("failed");
            return;
          }
        } catch (err) {
          // No link id in the URL: fall back to whatever the webhook did
          if (/Missing payment reference/.test(err.message)) {
            const fresh = await refreshUser();
            if (!isGone()) setStatus(fresh && fresh.plan !== "free" ? "success" : "pending");
            return;
          }
        }
        await new Promise((r) => setTimeout(r, RETRY_MS));
      }

      if (!isGone()) setStatus("pending");
    };

    run();
    return () => {
      unmounted.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const features = user?.plan && PLAN_FEATURES[user.plan] ? PLAN_FEATURES[user.plan] : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center border border-cyan-200">
        {status === "verifying" && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 border-4 border-cyan-300 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-cyan-600 mb-2">
              Verifying payment...
            </h2>
            <p className="text-sm text-gray-600">
              Please wait while we update your account
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                 <Check size={32} strokeWidth={3} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Payment Successful 🎉
            </h2>

            <p className="text-gray-600 mb-1">
              You are now on the <span className="font-bold text-cyan-600">
                {PLAN_LABEL[user?.plan] || user?.plan}
              </span> plan
            </p>
            {user?.planExpiresAt && (
              <p className="text-xs text-gray-500 mb-6">
                Active until {formatDate(user.planExpiresAt)}
              </p>
            )}

            {features.length > 0 && (
              <div className="bg-cyan-50 rounded-xl p-4 mb-6 text-left border border-cyan-100">
                <p className="text-xs font-bold text-cyan-800 uppercase tracking-wider mb-3">
                  Unlocked Features
                </p>
                <ul className="space-y-2">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check size={16} className="text-cyan-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => navigate("/")}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold shadow-lg shadow-cyan-200 transition-all transform hover:-translate-y-0.5"
            >
              Back to Editor
            </button>
          </>
        )}

        {(status === "pending" || status === "login") && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                <Clock size={30} strokeWidth={2.5} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {status === "login" ? "Payment received" : "Payment is processing"}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {status === "login"
                ? "Log in to see your upgraded plan. It is activated automatically once Razorpay confirms the payment."
                : "We haven't received confirmation from Razorpay yet. Your plan activates automatically within a few minutes. If money was deducted and your plan doesn't update, contact support."}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => (status === "login" ? navigate("/login") : window.location.reload())}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold transition"
              >
                {status === "login" ? "Log in" : "Check again"}
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition"
              >
                Back to Editor
              </button>
            </div>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <AlertTriangle size={30} strokeWidth={2.5} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-2">Payment not completed</h2>
            <p className="text-sm text-gray-600 mb-6">
              The payment was cancelled or did not go through. No plan change was made.
            </p>
            <button
              onClick={() => navigate("/upgrade")}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold transition"
            >
              Back to Plans
            </button>
          </>
        )}
      </div>
    </div>
  );
}
