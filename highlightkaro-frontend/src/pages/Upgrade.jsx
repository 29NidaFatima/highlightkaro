import { useAuth } from "../context/AuthContext";
import { createPaymentLink } from "../api/paymentApi";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

export default function Upgrade() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

const upgrade = async (plan) => {
  try {
    const res = await createPaymentLink(plan, token);

    
    navigate(`/payment-redirect?plan=${plan}`);


    setTimeout(() => {
      window.location.href = res.paymentLinkUrl;
    }, 1200);

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
        <p className="text-gray-600 text-sm">
          Unlock premium features and export watermark-free videos
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">

        {/* FREE */}
        <PlanCard
          title="Free"
          price="₹0"
          current={user.plan === "free"}
          features={[
            "1 color (Yellow)",
            "1 animation",
            "720p export",
            "Watermark enabled",
            "Light mode only",
          ]}
          buttonText="Current Plan"
          disabled
        />

        {/* BASIC */}
        <PlanCard
          title="Basic"
          price="₹19"
          highlight
          features={[
            "Yellow + Red colors",
            "4 animations",
            "1080p export",
            "No watermark",
            "Dark mode enabled",
          ]}
          buttonText="Upgrade to Basic"
          onClick={() => upgrade("basic19")}
          disabled={user.plan !== "free"}
        />

        {/* PRO */}
        <PlanCard
          title="Pro"
          price="₹99"
          premium
          features={[
            "All colors unlocked",
            "All animations",
            "1080p export",
            "No watermark",
            "Cloud save",
            "Templates (coming soon)",
          ]}
          buttonText="Go Pro"
          onClick={() => upgrade("pro99")}
          disabled={user.plan === "pro99"}
        />
      </div>

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

/* ---------- Reusable Card ---------- */
function PlanCard({
  title,
  price,
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
      className={`relative rounded-2xl border p-6 shadow-sm bg-white
        ${highlight && "border-cyan-500 shadow-lg"}
        ${premium && "border-purple-500"}
      `}
    >
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-xs px-3 py-1 rounded-full">
          Most Popular
        </span>
      )}

      {premium && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
          Best Value
        </span>
      )}

      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-gray-600 mb-4">{price}</p>

      <ul className="space-y-2 text-sm text-gray-700 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2">
            <Check size={16} className="text-cyan-500" />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-2 rounded-lg font-medium transition
          ${
            disabled
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : premium
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-cyan-500 hover:bg-cyan-600 text-white"
          }
        `}
      >
        {current ? "Current Plan" : buttonText}
      </button>
    </div>
  );
}
