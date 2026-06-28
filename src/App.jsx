import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Home from "./pages/home";
import Results from "./pages/results";
import Registration from "./pages/registration";
import Protests from "./pages/protests";

export default function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <Navigation />
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