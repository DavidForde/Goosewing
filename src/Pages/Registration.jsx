import { useState } from "react";

export default function Registration() {
  const [boats, setBoats] = useState(() => {
    const saved = localStorage.getItem("goosewing-boats");
    return saved ? JSON.parse(saved) : [];
  });

  const [form, setForm] = useState({
    sailNumber: "",
    boatName: "",
    helmName: ""
  });

  function save(next) {
    setBoats(next);
    localStorage.setItem("goosewing-boats", JSON.stringify(next));
  }

  function addBoat(e) {
    e.preventDefault();

    if (!form.sailNumber || !form.boatName || !form.helmName) return;

    const next = [
      ...boats,
      {
        id: crypto.randomUUID(),
        ...form,
        signedOn: false,
        paid: false
      }
    ];

    save(next);

    setForm({ sailNumber: "", boatName: "", helmName: "" });
  }

  function removeBoat(id) {
    save(boats.filter(b => b.id !== id));
  }

  function toggleField(id, field) {
    save(
      boats.map(b =>
        b.id === id ? { ...b, [field]: !b[field] } : b
      )
    );
  }

  return (
    <div>
      <h1>Registration</h1>

      <form onSubmit={addBoat} style={{ marginBottom: 20 }}>
        <input
          placeholder="Sail number"
          value={form.sailNumber}
          onChange={e => setForm({ ...form, sailNumber: e.target.value })}
        />

        <input
          placeholder="Boat name"
          value={form.boatName}
          onChange={e => setForm({ ...form, boatName: e.target.value })}
        />

        <input
          placeholder="Helm name"
          value={form.helmName}
          onChange={e => setForm({ ...form, helmName: e.target.value })}
        />

        <button type="submit">Add boat</button>
      </form>

      <h2>Fleet ({boats.length})</h2>

      <table>
        <thead>
          <tr>
            <th>Sail</th>
            <th>Boat</th>
            <th>Helm</th>
            <th>Regd.</th>
            <th>  Paid</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {boats.map(b => (
            <tr key={b.id}>
              <td>{b.sailNumber}</td>
              <td>{b.boatName}</td>
              <td>{b.helmName}</td>

              <td>
                <input
                  type="checkbox"
                  checked={b.signedOn}
                  onChange={() => toggleField(b.id, "signedOn")}
                />
              </td>

              <td>
                <input
                  type="checkbox"
                  checked={b.paid}
                  onChange={() => toggleField(b.id, "paid")}
                />
              </td>

              <td>
                <button onClick={() => removeBoat(b.id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}