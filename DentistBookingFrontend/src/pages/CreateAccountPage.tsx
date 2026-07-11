import { useState } from "react";
import { CreateDentist } from "../services/APIService";

function CreateAccountPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [status, setStatus] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    try {
      const payload = {
        First_Name: form.firstName,
        Last_Name: form.lastName,
        Email_Address: form.email,
        Phone_Number: form.phone,
        Password: form.password
      };
      await CreateDentist(payload);
      setStatus("Account created successfully.");
      setForm({ firstName: "", lastName: "", email: "", phone: "", password: "" });
    } catch (err: any) {
      console.error(err);
      setStatus(err?.response?.data || "Unable to create account.");
    }
  };

  return (
    <div className="page-layout">
      <form className="form-card booking-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <p className="eyebrow">Admin</p>
          <h1>Create account</h1>
        </div>

        <input name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} className="form-input" />
        <input name="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} className="form-input" />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="form-input" />
        <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className="form-input" />
        <input name="password" placeholder="Password" value={form.password} onChange={handleChange} className="form-input" type="password" />

        {status && <p className="form-note">{status}</p>}

        <button className="button button-primary" type="submit">Create account</button>
      </form>
    </div>
  );
}

export default CreateAccountPage;
