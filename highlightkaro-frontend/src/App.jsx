import { Routes, Route } from "react-router-dom";
import HighlightKaro from "./HighlightKaro";
import Login from "./pages/Login";
import Upgrade from "./pages/Upgrade";
import PaymentRedirect from "./pages/PaymentRedirect";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import Register from "./pages/Register";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HighlightKaro />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/upgrade" element={<Upgrade />} />
      <Route path="/payment-redirect" element={<PaymentRedirect />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-failed" element={<PaymentFailed />} />
    </Routes>
  );
}

export default App;




