import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DentistLogin } from "../services/APIService";
import "../styles/login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      const dentist = await DentistLogin(email, password);
      const normalizedDentist = {
        ID: dentist.ID ?? dentist.id,
        First_Name: dentist.First_Name ?? dentist.first_Name ?? "",
        Last_Name: dentist.Last_Name ?? dentist.last_Name ?? "",
        Email_Address: dentist.Email_Address ?? dentist.email_Address ?? "",
        Phone_Number: dentist.Phone_Number ?? dentist.phone_Number ?? "",
        Role: dentist.Role ?? dentist.role ?? "",
      };
      localStorage.setItem("dentist", JSON.stringify(normalizedDentist));
      window.dispatchEvent(new Event("dentist-auth-changed"));
      navigate("/dentist");
    } catch (error) {
      console.error(error);
      alert("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Member login</p>
        <h2>Sign in to your account</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
        />

        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

export default Login;
