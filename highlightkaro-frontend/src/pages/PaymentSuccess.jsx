import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Check, Clock, AlertTriangle, LoaderCircle, Sparkles, ArrowRight } from "lucide-react";
import StatusShell from "../components/StatusShell";
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
    <>
      {status === "verifying" && (
        <StatusShell tone="cyan" pulse icon={<LoaderCircle size={28} className="animate-spin" />} title="Verifying payment…">
          <p className="mt-3 text-sm text-gray-600">Confirming with Razorpay and updating your account. This takes a few seconds.</p>
          <div className="mx-auto mt-7 h-1.5 w-40 overflow-hidden rounded-full bg-cyan-100">
            <div className="h-full w-1/2 -translate-x-full animate-shimmer rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" />
          </div>
        </StatusShell>
      )}

      {status === "success" && (
        <StatusShell tone="green" icon={<Check size={30} strokeWidth={3} />} title="You're all set 🎉">
          <p className="mt-3 text-[15px] text-gray-600">
            Payment successful. You&apos;re now on the{" "}
            <span className="font-semibold text-cyan-700">{PLAN_LABEL[user?.plan] || user?.plan}</span> plan.
          </p>
          {user?.planExpiresAt && (
            <span className="hk-chip mt-3 bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
              <Clock size={12} /> Active until {formatDate(user.planExpiresAt)}
            </span>
          )}

          {features.length > 0 && (
            <div className="mt-7 rounded-2xl bg-white/70 p-5 text-left ring-1 ring-cyan-100">
              <p className="hk-eyebrow mb-3 text-cyan-800">
                <Sparkles size={12} /> Unlocked features
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check size={11} strokeWidth={3.5} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={() => navigate("/")} className="hk-btn hk-btn-primary hk-btn-lg mt-7 w-full">
            Start creating <ArrowRight size={17} />
          </button>
        </StatusShell>
      )}

      {(status === "pending" || status === "login") && (
        <StatusShell
          tone="amber"
          icon={<Clock size={28} strokeWidth={2.4} />}
          title={status === "login" ? "Payment received" : "Payment is processing"}
        >
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            {status === "login"
              ? "Log in to see your upgraded plan. It is activated automatically once Razorpay confirms the payment."
              : "We haven't received confirmation from Razorpay yet. Your plan activates automatically within a few minutes. If money was deducted and your plan doesn't update, contact support."}
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => (status === "login" ? navigate("/login") : window.location.reload())}
              className="hk-btn hk-btn-primary hk-btn-lg w-full"
            >
              {status === "login" ? "Log in" : "Check again"}
            </button>
            <button onClick={() => navigate("/")} className="hk-btn hk-btn-soft hk-btn-lg w-full">
              Back to editor
            </button>
          </div>
        </StatusShell>
      )}

      {status === "failed" && (
        <StatusShell tone="red" icon={<AlertTriangle size={28} strokeWidth={2.4} />} title="Payment not completed">
          <p className="mt-3 text-sm text-gray-600">
            The payment was cancelled or did not go through. No plan change was made.
          </p>
          <button onClick={() => navigate("/upgrade")} className="hk-btn hk-btn-primary hk-btn-lg mt-8 w-full">
            Back to plans
          </button>
        </StatusShell>
      )}
    </>
  );
}
