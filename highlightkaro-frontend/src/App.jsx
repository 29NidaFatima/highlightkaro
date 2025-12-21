import { BrowserRouter, Routes, Route } from "react-router-dom";
import HighlightKaro from "./HighlightKaro";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HighlightKaro />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;



