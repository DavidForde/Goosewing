import { NavLink } from "react-router-dom";

export default function Navigation() {
  return (
    <nav className="nav">
      <div className="nav-title">Goosewing</div>

      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>
          Dashboard
        </NavLink>

        <NavLink to="/results" className={({ isActive }) => isActive ? "active" : ""}>
          Results
        </NavLink>

        <NavLink to="/registration" className={({ isActive }) => isActive ? "active" : ""}>
          Registration
        </NavLink>

        <NavLink to="/protests" className={({ isActive }) => isActive ? "active" : ""}>
          Protests
        </NavLink>
      </div>
    </nav>
  );
}