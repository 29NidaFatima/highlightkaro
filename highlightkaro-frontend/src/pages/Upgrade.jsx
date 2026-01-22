import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createPaymentLink } from "../api/paymentApi";
import { fetchPricing } from "../api/pricingApi";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { PLAN_CODES } from "../config/pricingConfig";

export default function Upgrade() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [pricingData, setPricingData] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("global"); // default
  const [pricingError, setPricingError] = useState("");

  if (!user) {
    navigate("/login");
    return null;
  }

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

  const formatMonthly = (monthly) => {
    if (!currentPricing) return "";
    return `${currentPricing.currencySymbol}${monthly} ${currentPricing.cadenceLabel}`;
  };

  const upgrade = async (plan) => {
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
      alert(err.message || "Payment failed");
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50 px-4 py-10">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold text-cyan-600 mb-2">
          Upgrade Your Plan
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          Unlock premium features and export watermark-free videos
        </p>

        {/* Region Toggle */}
        {pricingData && (
          <div className="inline-flex bg-white/50 p-1 rounded-xl border border-cyan-100 shadow-sm">
            <button
              onClick={() => setSelectedRegion("india")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedRegion === "india"
                  ? "bg-white text-cyan-700 shadow-sm ring-1 ring-cyan-100"
                  : "text-gray-500 hover:text-cyan-600"
              }`}
            >
              🇮🇳 India Pricing
            </button>
            <button
              onClick={() => setSelectedRegion("global")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedRegion === "global"
                  ? "bg-white text-cyan-700 shadow-sm ring-1 ring-cyan-100"
                  : "text-gray-500 hover:text-cyan-600"
              }`}
            >
              🌍 International Pricing
            </button>
          </div>
        )}
        
        {/* Recommended Badge */}
        {pricingData?.recommendedRegion === selectedRegion && (
          <div className="mt-2 text-xs text-cyan-600 font-medium">
            ✨ Recommended for you
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">

        {/* FREE */}
        <PlanCard
          title="Free"
          price={planPrices ? formatMonthly(planPrices.free?.monthly ?? 0) : "—"}
          current={user.plan === "free"}
          features={[
            { text: "1 color (Yellow)", icon: "color" },
            { text: "1 animation", icon: "anim" },
            { text: "720p export", icon: "quality" },
            { text: "Watermark enabled", icon: "watermark" },
            { text: "Light mode only", icon: "theme" },
          ]}
          buttonText="Current Plan"
          disabled
        />

        {/* BASIC */}
        <PlanCard
          title="Basic"
          price={planPrices?.basic ? formatMonthly(planPrices.basic.monthly) : "—"}
          subPrice={planPrices?.basic?.perDayLabel || null}
          highlight
          current={user.plan === "basic30"}
          features={[
            { text: "Yellow + Red colors", icon: "color" },
            { text: "4 animations", icon: "anim" },
            { text: "1080p export", icon: "quality" },
            { text: "No watermark", icon: "watermark" },
            { text: "Legendary Dark Mode", icon: "theme", highlight: true, tooltip: "Galaxy interface with reduced eye strain" },
          ]}
          buttonText={user.plan === "basic30" ? "Current Plan" : "Upgrade to Basic"}
          onClick={() => upgrade(PLAN_CODES.BASIC)}
          disabled={user.plan !== "free"}
        />

        {/* PRO */}
        <PlanCard
          title="Pro"
          price={planPrices?.pro ? formatMonthly(planPrices.pro.monthly) : "—"}
          subPrice={planPrices?.pro?.perDayLabel || null}
          premium
          current={user.plan === "pro99"}
          features={[
            { text: "All colors unlocked", icon: "color" },
            { text: "All animations", icon: "anim" },
            { text: "1080p export", icon: "quality" },
            { text: "No watermark", icon: "watermark" },
            { text: "Legendary Dark Mode", icon: "theme", highlight: true },
            { text: "Cloud save", icon: "cloud" },
          ]}
          buttonText={user.plan === "pro99" ? "Current Plan" : "Go Pro"}
          onClick={() => upgrade(PLAN_CODES.PRO)}
          disabled={user.plan === "pro99"}
        />
      </div>
      
      {pricingError ? (
        <div className="max-w-5xl mx-auto mt-6">
          <div className="bg-white/90 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {pricingError}
          </div>
        </div>
      ) : null}

      {/* Footer */}
      <div className="text-center mt-10">
        <button
          onClick={() => navigate("/")}
          className="
            group inline-flex items-center gap-2
            px-4 py-2 rounded-lg
            text-sm font-medium text-cyan-700
            bg-white/80 backdrop-blur
            border border-cyan-200
            hover:bg-cyan-50 hover:border-cyan-300
            focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2
            transition-all duration-200
            shadow-sm
          "
        >
          <span className="transition-transform group-hover:-translate-x-1">←</span>
          Back to editor
        </button>


      </div>
    </div>
  );
}

/* ---------- Feature Item ---------- */
function FeatureItem({ feature }) {
  const text = typeof feature === "string" ? feature : feature.text;
  const isHighlight = typeof feature === "object" && feature.highlight;
  const tooltip = typeof feature === "object" && feature.tooltip;

  return (
    <li className="flex items-start gap-2 group relative">
      <Check size={16} className={`mt-0.5 flex-shrink-0 ${isHighlight ? "text-yellow-500" : "text-cyan-500"}`} />
      <span className={isHighlight ? "font-medium text-gray-800" : ""}>
        {text}
        {tooltip && (
          <span className="ml-1 text-gray-400 cursor-help" title={tooltip}>
            ?
          </span>
        )}
      </span>
    </li>
  );
}

/* ---------- Reusable Card ---------- */
function PlanCard({
  title,
  price,
  subPrice,
  features,
  buttonText,
  onClick,
  disabled,
  highlight,
  premium,
  current,
}) {
  return (
    <div
      className={`relative rounded-2xl border p-6 shadow-sm bg-white transition-all duration-200
        ${highlight && !current ? "border-cyan-500 shadow-lg hover:shadow-xl" : "border-cyan-200"}
        ${premium && !current ? "border-cyan-600 shadow-xl ring-1 ring-cyan-200 hover:shadow-2xl" : ""}
        ${current ? "border-cyan-500 ring-1  ring-cyan-100 " : ""}
      `}
    >
      {highlight && !current && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
          Most Popular
        </span>
      )}

      {premium && !current && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
          Best Value
        </span>
      )}

      {current && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-400 text-white text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
          Current Plan
        </span>
      )}

      <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
      <div className="mb-5">
        <p className="text-2xl font-bold text-gray-800">{price}</p>
        {subPrice && <p className="text-xs text-gray-500 mt-1">{subPrice}</p>}
      </div>

      <ul className="space-y-2.5 text-sm text-gray-700 mb-6">
        {features.map((f, i) => (
          <FeatureItem key={i} feature={f} />
        ))}
      </ul>

      <button
        onClick={onClick}
        disabled={disabled || current}
        className={`w-full py-2.5 rounded-lg font-medium transition-all duration-200
          ${
            disabled || current
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : premium
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg"
              : "bg-cyan-500 hover:bg-cyan-600 text-white shadow-sm hover:shadow-md"
          }
        `}
      >
        {buttonText}
      </button>
    </div>
  );
}
