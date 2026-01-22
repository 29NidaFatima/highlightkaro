import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Check } from "lucide-react";

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

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(true);

  useEffect(() => {
    // Auto-refresh user data after payment
    const refresh = async () => {
      try {
        await refreshUser();
      } catch (err) {
        console.error("Failed to refresh user data:", err);
      } finally {
        setIsRefreshing(false);
      }
    };

    refresh();
  }, [refreshUser]);

  const features = user?.plan && PLAN_FEATURES[user.plan] ? PLAN_FEATURES[user.plan] : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center border border-cyan-200">
        {isRefreshing ? (
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
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                 <Check size={32} strokeWidth={3} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Payment Successful 🎉
            </h2>

            <p className="text-gray-600 mb-6">
              You are now on the <span className="font-bold text-cyan-600 capitalize">
                {user?.plan === "pro99" ? "Pro" : user?.plan === "basic30" ? "Basic" : user?.plan}
              </span> plan
            </p>

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
      </div>
    </div>
  );
}
