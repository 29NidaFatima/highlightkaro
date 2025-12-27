import { Routes, Route } from "react-router-dom";
import HighlightKaro from "./HighlightKaro";
import Login from "./pages/Login";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HighlightKaro />} />
      <Route  path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;




