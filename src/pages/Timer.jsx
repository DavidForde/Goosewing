import { useState, useEffect, useRef } from "react";

const SEQUENCE = [
  { label: "Warning", seconds: 300, signal: "One long" },
  { label: "Preparatory", seconds: 240, signal: "One long" },
  { label: "One Minute", seconds: 60, signal: "One long" },
  { label: "Start", seconds: 0, signal: "One long" },
];

function formatTime(seconds) {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60).toString().padStart(2, "0");
  const s = (abs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function loadBoats() {
  try {
    const raw = localStorage.getItem("goosewing-boats");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveFinishes(finishes) {
  try {
    localStorage.setItem("goosewing-timer-finishes", JSON.stringify(finishes));
  } catch {}
}

export default function Timer() {
  const [phase, setPhase] = useState(null); // null = not started
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false); // gun has fired
  const [elapsed, setElapsed] = useState(0); // seconds since gun
  const [finishes, setFinishes] = useState([]); // { boatId, sailNumber, boatName, elapsed }
  const [boats, setBoats] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    setBoats(loadBoats());
  }, []);

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      if (!started) {
        setSecondsLeft((prev) => {
          const next = prev - 1;
          // Check if we hit a sequence boundary
          if (next <= 0) {
            setStarted(true);
            setPhase("Racing");
            return 0;
          }
          // Update phase label
          if (next <= 60) setPhase("One Minute");
          else if (next <= 240) setPhase("Preparatory");
          else setPhase("Warning");
          return next;
        });
      } else {
        setElapsed((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, started]);

  function startSequence() {
    setPhase("Warning");
    setSecondsLeft(300);
    setStarted(false);
    setElapsed(0);
    setFinishes([]);
    setRunning(true);
  }

  function stopReset() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setStarted(false);
    setPhase(null);
    setSecondsLeft(300);
    setElapsed(0);
    setFinishes([]);
  }

  function recordFinish(boat) {
    if (!started) return;
    if (finishes.find((f) => f.boatId === boat.id)) return; // already finished
    const finish = {
      boatId: boat.id,
      sailNumber: boat.sailNumber,
      boatName: boat.boatName,
      elapsed,
      position: finishes.length + 1,
    };
    const next = [...finishes, finish];
    setFinishes(next);
    saveFinishes(next);
  }

  const finishedIds = new Set(finishes.map((f) => f.boatId));
  const unfinished = boats.filter((b) => !finishedIds.has(b.id));

  function getPhaseColour() {
    if (!phase) return "#0a1628";
    if (started) return "#1a6b1a";
    if (phase === "One Minute") return "#b8360a";
    if (phase === "Preparatory") return "#8a6800";
    return "#0a1628";
  }

  return (
    <div className="app">
      <header className="header" style={{ background: `linear-gradient(135deg, ${getPhaseColour()} 0%, ${getPhaseColour()}cc 100%)` }}>
        <h1>Goosewing</h1>
        <p className="subtitle">Start Sequence & Race Timer</p>
      </header>

      <section className="panel">
        {/* Phase label */}
        <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          <span style={{
            fontSize: "0.8rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: started ? "#1a6b1a" : phase === "One Minute" ? "#b8360a" : "#5a7a9a"
          }}>
            {phase ?? "Ready"}
          </span>
        </div>

        {/* Main clock */}
        <div style={{
          fontSize: "5rem",
          fontWeight: 700,
          textAlign: "center",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-2px",
          color: started ? "#1a6b1a" : "#0a1628",
          lineHeight: 1,
          marginBottom: "1.5rem",
        }}>
          {started ? formatTime(elapsed) : formatTime(secondsLeft)}
        </div>

        {/* Sequence indicators */}
        {!started && (
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {SEQUENCE.map((s) => (
              <div key={s.label} style={{
                padding: "0.25rem 0.6rem",
                borderRadius: "999px",
                fontSize: "0.75rem",
                fontWeight: 600,
                background: phase === s.label ? "#0a1628" : "#f4f6f9",
                color: phase === s.label ? "#fff" : "#5a7a9a",
                border: "1.5px solid",
                borderColor: phase === s.label ? "#0a1628" : "#d0dce8",
              }}>
                {s.label}
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          {!running ? (
            <button onClick={startSequence} style={{
              padding: "0.75rem 2rem",
              background: "#0a1628",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}>
              Start Sequence
            </button>
          ) : (
            <button onClick={stopReset} style={{
              padding: "0.75rem 2rem",
              background: "#c0392b",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}>
              Reset
            </button>
          )}
        </div>
      </section>

      {/* Finish buttons — only show after gun */}
      {started && unfinished.length > 0 && (
        <section className="panel">
          <h2>Record finish</h2>
          <p className="hint">Tap a boat as it crosses the line.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            {unfinished.map((boat) => (
              <button key={boat.id} onClick={() => recordFinish(boat)} style={{
                padding: "0.75rem 1.25rem",
                background: "#1e3a5f",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                minWidth: "5rem",
              }}>
                {boat.sailNumber}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Finishes recorded */}
      {finishes.length > 0 && (
        <section className="panel">
          <h2>Finishes</h2>
          <table className="results">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Sail #</th>
                <th>Boat</th>
                <th>Elapsed</th>
              </tr>
            </thead>
            <tbody>
              {finishes.map((f) => (
                <tr key={f.boatId}>
                  <td>{f.position}</td>
                  <td className="sail-number">{f.sailNumber}</td>
                  <td>{f.boatName}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{formatTime(f.elapsed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {started && unfinished.length === 0 && finishes.length > 0 && (
        <section className="panel" style={{ textAlign: "center", color: "#1a6b1a", fontWeight: 600 }}>
          All boats finished — results saved.
        </section>
      )}
    </div>
  );
}