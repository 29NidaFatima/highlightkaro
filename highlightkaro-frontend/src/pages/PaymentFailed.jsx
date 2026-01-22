import { useNavigate } from "react-router-dom";

export default function PaymentFailed() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-pink-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm text-center border border-red-200">
        <div className="text-4xl mb-3">⚠️</div>

        <h2 className="text-2xl font-bold text-red-600 mb-2">
          Payment Failed
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          We couldn't process your payment. Please try again or use a different payment method.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/upgrade")}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-lg shadow-red-100 transition-all transform hover:-translate-y-0.5"
          >
            Try Again
          </button>
          
          <button
            onClick={() => navigate("/upgrade")}
            className="w-full py-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition"
          >
            Back to Plans
          </button>

          <a
            href="mailto:support@highlightkaro.com"
            className="block w-full py-3 text-sm text-gray-500 hover:text-gray-700 font-medium transition"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
