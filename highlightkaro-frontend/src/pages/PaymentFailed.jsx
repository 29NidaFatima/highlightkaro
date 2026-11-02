import { useNavigate } from "react-router-dom";
import { TriangleAlert, RotateCcw, Mail } from "lucide-react";
import StatusShell from "../components/StatusShell";

export default function PaymentFailed() {
  const navigate = useNavigate();

  return (
    <StatusShell tone="red" icon={<TriangleAlert size={28} strokeWidth={2.4} />} title="Payment didn't go through">
      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        The payment was cancelled or declined, so no money was taken and your plan hasn&apos;t changed. You can try again
        or pick a different payment method.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <button onClick={() => navigate("/upgrade")} className="hk-btn hk-btn-primary hk-btn-lg w-full">
          <RotateCcw size={17} /> Try again
        </button>
        <button onClick={() => navigate("/")} className="hk-btn hk-btn-soft hk-btn-lg w-full">
          Back to editor
        </button>
        <a
          href="mailto:support@highlightkaro.com"
          className="hk-btn hk-btn-ghost w-full text-gray-500"
        >
          <Mail size={15} /> Contact support
        </a>
      </div>
    </StatusShell>
  );
}
