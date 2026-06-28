import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Results from "./pages/Results";
import Registration from "./pages/Registration";
import Protests from "./pages/Protests";
import Timer from "./pages/Timer";

export default function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/results" element={<Results />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/protests" element={<Protests />} />
          <Route path="/timer" element={<Timer />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}