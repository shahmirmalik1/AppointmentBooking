import { Link, useNavigate } from "react-router-dom";
import { getContactInfo } from "../services/APIService";
import { useEffect, useState } from "react";

function Navbar() {
  const [title, setTitle] = useState("");
  const [dentist, setDentist] = useState<any | null>(null);
  const navigate = useNavigate();

  const normalizeDentist = (saved: any) => ({
    ID: saved.ID ?? saved.id,
    First_Name: saved.First_Name ?? saved.first_Name ?? "",
    Last_Name: saved.Last_Name ?? saved.last_Name ?? "",
    Email_Address: saved.Email_Address ?? saved.email_Address ?? "",
    Phone_Number: saved.Phone_Number ?? saved.phone_Number ?? "",
    Role: saved.Role ?? saved.role ?? "",
  });

  useEffect(() => {
    const fetchTitle = async () => {
      try {
        const data = await getContactInfo(1);
        setTitle(data.website_Title || "");
      } catch (error) {
        console.log("Failed to load title", error);
      }
    };

    fetchTitle();

    const updateAuth = () => {
      const saved = localStorage.getItem("dentist");
      setDentist(saved ? normalizeDentist(JSON.parse(saved)) : null);
    };

    updateAuth();
    window.addEventListener("dentist-auth-changed", updateAuth);
    return () => window.removeEventListener("dentist-auth-changed", updateAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("dentist");
    setDentist(null);
    navigate("/login");
  };

  return (
    <nav className="site-nav">
      <div className="nav-top">
        <h2 className="logo">{title}</h2>
        {dentist ? (
          <div className="nav-auth-actions">
            <span className="nav-welcome">Welcome, {dentist.First_Name}</span>
            <button className="button button-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="button button-secondary">
            Login
          </Link>
        )}
      </div>
      <div className="nav-links">
        <Link to="/" className="nav-link">
          Home
        </Link>
        <Link to="/book" className="nav-link">
          Book Appointment
        </Link>
        <Link to="/contact" className="nav-link">
          Contact Us
        </Link>
        {dentist ? (
          <Link to="/dentist" className="nav-link">
            Dashboard
          </Link>
        ) : null}
        {dentist ? (
          <>
            <details className="nav-group">
              <summary className="nav-link nav-group-title">Setup</summary>
              <div className="nav-group-menu">
                <Link to="/add-doctor" className="nav-group-link">Add Doctor</Link>
                <Link to="/add-procedure" className="nav-group-link">Add Procedure</Link>
                <Link to="/create-account" className="nav-group-link">Create Dentist Account</Link>
              </div>
            </details>
            <details className="nav-group">
              <summary className="nav-link nav-group-title">View</summary>
              <div className="nav-group-menu">
                <Link to="/doctors" className="nav-group-link">All Doctors</Link>
                <Link to="/procedures" className="nav-group-link">All Procedures</Link>
                <Link to="/all-queries" className="nav-group-link">All Queries</Link>
                <Link to="/patient-history" className="nav-group-link">Patient History</Link>
              </div>
            </details>
          </>
        ) : null}
      </div>
    </nav>
  );
}

export default Navbar;