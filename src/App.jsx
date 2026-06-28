import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Results from "./pages/Results";
import Registration from "./pages/Registration";
import Protests from "./pages/Protests";

export default function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/results" element={<Results />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/protests" element={<Protests />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}