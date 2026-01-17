import { useSearchParams } from "react-router-dom";

export default function PaymentRedirect() {
  const [params] = useSearchParams();
  const plan = params.get("plan");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50">
      <div className="bg-white/90 backdrop-blur-md border border-cyan-200 rounded-2xl shadow-xl p-8 max-w-sm text-center">
        <h2 className="text-xl font-semibold text-cyan-600 mb-2">
          Redirecting to secure payment
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          Upgrading to <span className="font-medium capitalize">{plan}</span> plan
        </p>

        <div className="flex justify-center mb-6">
          <div className="w-10 h-10 border-4 border-cyan-300 border-t-transparent rounded-full animate-spin" />
        </div>

        <p className="text-xs text-gray-500">
          Payments are securely processed by Razorpay
        </p>
      </div>
    </div>
  );
}
