import { Routes, Route } from "react-router-dom";
import HighlightKaro from "./HighlightKaro";
import Login from "./pages/Login";
import Upgrade from "./pages/Upgrade";
import PaymentRedirect from "./pages/PaymentRedirect";
import PaymentSuccess from "./pages/PaymentSuccess";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HighlightKaro />} />
      <Route path="/login" element={<Login />} />
      <Route path="/upgrade" element={<Upgrade />} />
      <Route path="/payment-redirect" element={<PaymentRedirect />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
    </Routes>
  );
}

export default App;




