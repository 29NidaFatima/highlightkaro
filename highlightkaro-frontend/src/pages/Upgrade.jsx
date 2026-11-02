import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createPaymentLink } from "../api/paymentApi";
import { fetchPricing } from "../api/pricingApi";
import { useNavigate } from "react-router-dom";
import { Check, X, ArrowLeft, ArrowRight, Sparkles, Crown, ShieldCheck, CreditCard, Zap, LoaderCircle, IndianRupee, Globe } from "lucide-react";
import Logo from "../components/Logo";
import { PLAN_CODES } from "../config/pricingConfig";
import { showToast } from "../utils/toast";

const PLAN_ORDER = ["free", "basic30", "pro99"];

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null;

export default function Upgrade() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [pricingData, setPricingData] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("global"); // default
  const [pricingError, setPricingError] = useState("");
  const [pendingPlan, setPendingPlan] = useState(null);

  useEffect(() => {
    if (!user) navigate("/login?return=upgrade");
  }, [user, navigate]);

  useEffect(() => {
    let mounted = true;
    fetchPricing()
      .then((data) => {
        if (mounted && data.pricing) {
          setPricingData(data);
          // Set recommended region if available, otherwise default to global
          if (data.recommendedRegion) {
            setSelectedRegion(data.recommendedRegion);
          }
        }
      })
      .catch((err) => {
        if (mounted) setPricingError(err.message || "Failed to load pricing");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const currentPricing = useMemo(() => {
    if (!pricingData?.pricing) return null;
    return pricingData.pricing[selectedRegion] || pricingData.pricing.global;
  }, [pricingData, selectedRegion]);

  const planPrices = useMemo(() => {
    if (!currentPricing) return null;
    return {
      free: { monthly: 0 }, // Free is always 0
      basic: currentPricing.basic,
      pro: currentPricing.pro,
      currencySymbol: currentPricing.currencySymbol,
      cadenceLabel: currentPricing.cadenceLabel,
    };
  }, [currentPricing]);

  const formatPrice = (monthly) => ({
    amount: `${currentPricing.currencySymbol}${monthly}`,
    cadence: currentPricing.cadenceLabel,
  });

  const upgrade = async (plan) => {
    if (pendingPlan) return;
    setPendingPlan(plan);
    try {
      // Step 1: Call createPaymentLink with plan, region, and token
      const res = await createPaymentLink(plan, selectedRegion, token);
      
      // Step 2: Redirect to intermediate page
      const planKey = plan === PLAN_CODES.BASIC ? 'basic' : 'pro';
      const amount = planPrices[planKey].monthly;
      
      navigate("/payment-redirect", {
        state: {
          paymentLink: res.paymentLinkUrl,
          plan: plan === PLAN_CODES.BASIC ? 'Basic' : 'Pro',
          amount: amount,
          currency: currentPricing.currency,
          billingCycle: currentPricing.cadenceLabel
        }
      });
      
    } catch (err) {
      showToast(err.message || "Payment failed", "error");
      setPendingPlan(null);
    }
  };

  if (!user) return null;

  const currentRank = PLAN_ORDER.indexOf(user.plan);
  const expiresOn = formatDate(user.planExpiresAt);
  // A plan can be bought if it's higher than the current one, or renewed if it's the same paid plan
  const planButton = (code, buyLabel) => {
    const rank = PLAN_ORDER.indexOf(code);
    if (pendingPlan === code) return { text: "Opening checkout…", disabled: true };
    if (!planPrices) return { text: buyLabel, disabled: true };
    if (rank < currentRank) return { text: "Included in your plan", disabled: true };
    if (rank === currentRank) return { text: "Renew for 1 month", disabled: !!pendingPlan, renew: true };
    return { text: buyLabel, disabled: !!pendingPlan };
  };
  const basicBtn = planButton(PLAN_CODES.BASIC, "Upgrade to Basic");
  const proBtn = planButton(PLAN_CODES.PRO, user.plan === "basic30" ? "Upgrade to Pro" : "Go Pro");


  return (
    <div className="hk-page">
      {/* Top bar */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Logo onClick={() => navigate("/")} />
        <button onClick={() => navigate("/")} className="hk-btn hk-btn-ghost">
          <ArrowLeft size={16} /> Back to editor
        </button>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-4">
        {/* Hero */}
        <div className="mx-auto max-w-2xl animate-fade-up text-center">
          <span className="hk-chip bg-white/80 text-cyan-700 ring-1 ring-cyan-100">
            <Sparkles size={12} /> Simple monthly pricing
          </span>
          <h1 className="mt-4 text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Upgrade your <span className="hk-gradient-text">highlights</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-[15px] text-gray-600">
            Watermark-free 1080p exports, more colours and every animation. One-time payment for 30 days, no auto-renewal.
          </p>

          {user.plan !== "free" && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm text-gray-700 ring-1 ring-cyan-100">
              <Crown size={14} className="text-cyan-600" />
              You&apos;re on <span className="font-semibold text-cyan-700">{user.plan === "pro99" ? "Pro" : "Basic"}</span>
              {expiresOn ? <>· active until <span className="font-semibold">{expiresOn}</span></> : null}
            </p>
          )}

          {/* Region Toggle */}
          {pricingData && (
            <div className="mt-7 flex flex-col items-center gap-2">
              <div className="hk-segment w-full max-w-xs bg-white/70 ring-1 ring-cyan-100">
                <button
                  data-active={selectedRegion === "india"}
                  onClick={() => setSelectedRegion("india")}
                  className="hk-segment-item"
                >
                  <span className="inline-flex items-center justify-center gap-1.5"><IndianRupee size={14} /> India</span>
                </button>
                <button
                  data-active={selectedRegion === "global"}
                  onClick={() => setSelectedRegion("global")}
                  className="hk-segment-item"
                >
                  <span className="inline-flex items-center justify-center gap-1.5"><Globe size={14} /> Global · $</span>
                </button>
              </div>
              {pricingData?.recommendedRegion === selectedRegion && (
                <span className="text-xs font-medium text-cyan-700">✨ Recommended for your location</span>
              )}
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 grid items-stretch gap-5 md:grid-cols-3">
          {/* FREE */}
          <PlanCard
            title="Free"
            blurb="Try it out"
            price={planPrices ? formatPrice(0) : null}
            current={user.plan === "free"}
            features={[
              { text: "Yellow highlight", on: true },
              { text: "Left → Right animation", on: true },
              { text: "720p export", on: true },
              { text: "2 exports per day", on: true },
              { text: "Watermark on videos", on: false },
              { text: "Light mode only", on: false },
            ]}
            buttonText={user.plan === "free" ? "Your current plan" : "Included"}
            disabled
          />

          {/* BASIC */}
          <PlanCard
            title="Basic"
            blurb="For regular creators"
            price={planPrices?.basic ? formatPrice(planPrices.basic.monthly) : null}
            subPrice={planPrices?.basic?.perDayLabel || null}
            badge="Most popular"
            current={user.plan === "basic30"}
            features={[
              { text: "Yellow + Red colours", on: true },
              { text: "4 animations", on: true },
              { text: "1080p export", on: true },
              { text: "Unlimited exports", on: true },
              { text: "No watermark", on: true },
              { text: "Legendary Dark Mode", on: true, star: true },
            ]}
            buttonText={basicBtn.text}
            loading={pendingPlan === PLAN_CODES.BASIC}
            onClick={() => upgrade(PLAN_CODES.BASIC)}
            disabled={basicBtn.disabled}
            renewable={basicBtn.renew}
          />

          {/* PRO */}
          <PlanCard
            title="Pro"
            blurb="Everything, unlocked"
            price={planPrices?.pro ? formatPrice(planPrices.pro.monthly) : null}
            subPrice={planPrices?.pro?.perDayLabel || null}
            badge="Best value"
            premium
            current={user.plan === "pro99"}
            features={[
              { text: "All 6 colours", on: true },
              { text: "All 5 animations incl. Underline", on: true },
              { text: "1080p export", on: true },
              { text: "Unlimited exports", on: true },
              { text: "No watermark", on: true },
              { text: "Legendary Dark Mode", on: true, star: true },
              { text: "Cloud save (coming soon)", on: true },
            ]}
            buttonText={proBtn.text}
            loading={pendingPlan === PLAN_CODES.PRO}
            onClick={() => upgrade(PLAN_CODES.PRO)}
            disabled={proBtn.disabled}
            renewable={proBtn.renew}
          />
        </div>

        {pricingError ? (
          <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-red-200 bg-white/90 px-4 py-3 text-center text-sm text-red-700">
            {pricingError}
          </div>
        ) : null}

        {/* Trust row */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-cyan-600" /> Secure checkout by Razorpay
          </span>
          <span className="flex items-center gap-2">
            <CreditCard size={16} className="text-cyan-600" /> UPI, cards &amp; netbanking
          </span>
          <span className="flex items-center gap-2">
            <Zap size={16} className="text-cyan-600" /> Activates instantly
          </span>
        </div>
      </main>
    </div>
  );
}

/* ---------- Feature Item ---------- */
function FeatureItem({ feature, premium }) {
  return (
    <li className={`flex items-start gap-2.5 ${feature.on ? "" : "text-gray-400"}`}>
      <span
        className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full ${
          !feature.on
            ? "bg-gray-100 text-gray-400"
            : feature.star
              ? "bg-yellow-100 text-yellow-600"
              : premium
                ? "bg-white/20 text-white"
                : "bg-cyan-100 text-cyan-700"
        }`}
      >
        {feature.on ? <Check size={11} strokeWidth={3.5} /> : <X size={11} strokeWidth={3} />}
      </span>
      <span className={feature.star ? "font-semibold" : ""}>{feature.text}</span>
    </li>
  );
}

/* ---------- Reusable Card ---------- */
function PlanCard({
  title,
  blurb,
  price,
  subPrice,
  badge,
  features,
  buttonText,
  onClick,
  disabled,
  premium,
  current,
  renewable,
  loading,
}) {
  const buttonDisabled = disabled || (current && !renewable);

  return (
    <div
      className={`relative flex flex-col rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 ${
        premium
          ? "bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 text-white shadow-[0_30px_60px_-24px_rgba(8,145,178,0.75)]"
          : `hk-glass ${current ? "ring-2 ring-cyan-400" : ""}`
      }`}
    >
      {(current || badge) && (
        <span
          className={`hk-chip absolute -top-3 left-7 ${
            current
              ? "bg-gray-900 text-white"
              : premium
                ? "bg-yellow-300 text-gray-950"
                : "bg-cyan-500 text-white"
          }`}
        >
          {current ? "Current plan" : badge}
        </span>
      )}

      <h3 className={`text-xl font-bold ${premium ? "text-white" : "text-gray-900"}`}>{title}</h3>
      <p className={`mt-0.5 text-sm ${premium ? "text-cyan-50/80" : "text-gray-500"}`}>{blurb}</p>

      <div className="mt-6 min-h-[64px]">
        {price ? (
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-5xl font-extrabold tracking-tight">{price.amount}</span>
            <span className={`text-sm ${premium ? "text-cyan-50/80" : "text-gray-500"}`}>{price.cadence}</span>
          </p>
        ) : (
          <span className="block h-12 w-28 animate-pulse rounded-xl bg-gray-200/70" />
        )}
        {subPrice && <p className={`mt-1 text-xs ${premium ? "text-cyan-50/80" : "text-gray-500"}`}>{subPrice}</p>}
      </div>

      <ul className={`mt-6 flex-1 space-y-3 text-sm ${premium ? "text-white" : "text-gray-700"}`}>
        {features.map((f, i) => (
          <FeatureItem key={i} feature={f} premium={premium} />
        ))}
      </ul>

      <button
        onClick={onClick}
        disabled={buttonDisabled}
        className={`hk-btn hk-btn-lg mt-8 w-full ${
          buttonDisabled
            ? premium
              ? "bg-white/15 text-white/80 disabled:opacity-100"
              : "bg-gray-100 text-gray-500 disabled:opacity-100"
            : premium
              ? "bg-white text-cyan-700 shadow-lg hover:bg-cyan-50"
              : "hk-btn-primary"
        }`}
      >
        {loading && <LoaderCircle size={17} className="animate-spin" />}
        {buttonText}
        {!buttonDisabled && !loading && <ArrowRight size={16} />}
      </button>
    </div>
  );
}
