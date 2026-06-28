import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home">

      <h1>Goosewing</h1>
      <p className="subtitle">Race Management System</p>

      <div className="grid">

        <Link to="/results" className="card">
          <h2>🏁 Results</h2>
          <p>Enter finishes and view series standings</p>
        </Link>

        <Link to="/registration" className="card">
          <h2>📝 Registration</h2>
          <p>Add and manage boats</p>
        </Link>

        <Link to="/protests" className="card">
          <h2>⚖ Protests</h2>
          <p>Submit and track hearings</p>
        </Link>

      </div>

    </div>
  );
}