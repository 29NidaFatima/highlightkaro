import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ✅ CHANGE: consistent naming
const PLAN_ORDER = ["free", "basic19", "pro99"];

const PlanGuard = ({ requiredPlan, children, darkMode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* ---------- NOT LOGGED IN ---------- */
  if (!user) {
    return (
      <div
        className={`mt-4 p-4 rounded-xl border text-center backdrop-blur-sm
        ${
          darkMode
            ? "bg-gray-900 border-yellow-500/20 text-gray-300"
            : "bg-white/90 border-orange-200 text-gray-700"
        }`}
      >
        <p className="text-sm mb-3">
          Login to continue creating highlights
        </p>

        <button
          onClick={() => navigate("/login")}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition
          ${
            darkMode
              ? "bg-yellow-500 text-black hover:bg-yellow-400"
              : "bg-orange-500 text-white hover:bg-orange-600"
          }`}
        >
          Login
        </button>
      </div>
    );
  }

  /* ---------- PLAN TOO LOW ---------- */
  if (
    PLAN_ORDER.indexOf(user.plan) <
    PLAN_ORDER.indexOf(requiredPlan)
  ) {
    return (
      <div
        className={`mt-4 p-4 rounded-xl border text-sm
        ${
          darkMode
            ? "bg-gray-900 border-yellow-500/20 text-gray-300"
            : "bg-orange-50 border-orange-200 text-gray-800"
        }`}
      >
        <p className="font-medium mb-1">
          Current Plan:{" "}
          <span className="capitalize">{user.plan}</span>
        </p>

        <p className="mb-3 opacity-80">
          Upgrade to{" "}
          <span className="font-medium capitalize">
            {requiredPlan}
          </span>{" "}
          to unlock this feature
        </p>

        {/* ✅ CHANGE: real navigation */}
        <button
          onClick={() => navigate("/upgrade")}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition
          ${
            darkMode
              ? "bg-yellow-500 text-black hover:bg-yellow-400"
              : "bg-orange-500 text-white hover:bg-orange-600"
          }`}
        >
          Upgrade Plan
        </button>
      </div>
    );
  }

  return children;
};

export default PlanGuard;
