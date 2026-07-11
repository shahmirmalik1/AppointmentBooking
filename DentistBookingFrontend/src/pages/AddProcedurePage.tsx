import { useState, useEffect } from "react";
import { CreateProcedure, GetAllDoctors, LinkDoctorProcedure } from "../services/APIService";

function AddProcedurePage() {
  const [form, setForm] = useState({ name: "", duration: 30, price: 0 });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctors, setSelectedDoctors] = useState<number[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const d = await GetAllDoctors();
        setDoctors(d || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleDoctor = (id: number) => {
    setSelectedDoctors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    try {
      const payload = { Procedure_Name: form.name, Procedure_Duration_mins: Number(form.duration), Price: Number(form.price) };
      const created = await CreateProcedure(payload);
      const procId = created.ID ?? created.id;

      // link selected doctors
      for (const docId of selectedDoctors) {
        await LinkDoctorProcedure({ DoctorID: docId, ProcedureID: procId });
      }

      setStatus("Procedure created and linked.");
      setForm({ name: "", duration: 30, price: 0 });
      setSelectedDoctors([]);
    } catch (err: any) {
      console.error(err);
      setStatus(err?.response?.data || "Unable to create procedure.");
    }
  };

  return (
    <div className="page-layout">
      <form className="form-card booking-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <p className="eyebrow">Admin</p>
          <h1>Add procedure</h1>
        </div>

        <input name="name" placeholder="Procedure name" value={form.name} onChange={handleChange} className="form-input" />
        <input name="duration" placeholder="Duration (mins)" value={form.duration} onChange={handleChange} className="form-input" type="number" />
        <input name="price" placeholder="Price" value={form.price} onChange={handleChange} className="form-input" type="number" step="0.01" />

        <div>
          <p className="form-label">Link doctors who can perform this procedure</p>
          <div className="checkbox-list">
            {doctors.map(d => (
              <label key={d.id} className="checkbox-row">
                <input type="checkbox" checked={selectedDoctors.includes(d.id)} onChange={() => toggleDoctor(d.id)} /> {d.first_Name} {d.last_Name}
              </label>
            ))}
          </div>
        </div>

        {status && <p className="form-note">{status}</p>}

        <button className="button button-primary" type="submit">Create procedure</button>
      </form>
    </div>
  );
}

export default AddProcedurePage;
