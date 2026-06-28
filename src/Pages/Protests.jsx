import { useState } from "react";

export default function Protests() {
  const [protests, setProtests] = useState(() => {
    const saved = localStorage.getItem("goosewing-protests");
    return saved ? JSON.parse(saved) : [];
  });

  const [form, setForm] = useState({
    protestor: "",
    protested: "",
    race: "",
    description: ""
  });

  function save(next) {
    setProtests(next);
    localStorage.setItem("goosewing-protests", JSON.stringify(next));
  }

  function submit(e) {
    e.preventDefault();

    if (!form.protestor || !form.protested || !form.description) return;

    const next = [
      ...protests,
      {
        id: crypto.randomUUID(),
        ...form,
        status: "OPEN",
        decision: ""
      }
    ];

    save(next);
    setForm({ protestor: "", protested: "", race: "", description: "" });
  }

  function setStatus(id, status) {
    save(
      protests.map(p =>
        p.id === id ? { ...p, status } : p
      )
    );
  }

  function setDecision(id, decision) {
    save(
      protests.map(p =>
        p.id === id ? { ...p, decision } : p
      )
    );
  }

  return (
    <div>
      <h1>Protests</h1>

      <form onSubmit={submit} style={{ marginBottom: 20 }}>
        <input
          placeholder="Protestor boat"
          value={form.protestor}
          onChange={e => setForm({ ...form, protestor: e.target.value })}
        />

        <input
          placeholder="Protested boat"
          value={form.protested}
          onChange={e => setForm({ ...form, protested: e.target.value })}
        />

        <input
          placeholder="Race number"
          value={form.race}
          onChange={e => setForm({ ...form, race: e.target.value })}
        />

        <textarea
          placeholder="Description of incident"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />

        <button type="submit">Submit protest</button>
      </form>

      <h2>Open Protests</h2>

      {protests.map(p => (
        <div key={p.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
          <strong>{p.protestor} vs {p.protested}</strong>
          <div>Race: {p.race}</div>
          <p>{p.description}</p>

          <div>
            Status:
            <select
              value={p.status}
              onChange={e => setStatus(p.id, e.target.value)}
            >
              <option>OPEN</option>
              <option>HEARING</option>
              <option>CLOSED</option>
            </select>
          </div>

          <textarea
            placeholder="Decision"
            value={p.decision}
            onChange={e => setDecision(p.id, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}