import { useNavigate } from "react-router-dom";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm text-center border border-cyan-200">
        <div className="text-4xl mb-3">🎉</div>

        <h2 className="text-2xl font-bold text-cyan-600 mb-2">
          Payment Successful
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          Your plan has been upgraded. Enjoy premium features 🚀
        </p>

        <button
          onClick={() => navigate("/")}
          className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition"
        >
          Go to Editor
        </button>
      </div>
    </div>
  );
}
