import { useEffect, useState } from "react";
import { GetAllAppointments } from "../services/APIService";

function AllAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const a = await GetAllAppointments();
        setAppointments(a || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  return (
    <div className="page-layout">
      <div className="form-card booking-form">
        <div className="form-header">
          <p className="eyebrow">Admin</p>
          <h1>All appointments</h1>
        </div>

        <div className="list-grid">
          {appointments.map(a => (
            <div key={a.id ?? a.ID} className="list-row">
              <div>
                <strong>{a.customer_Full_Name ?? a.Customer_Full_Name ?? "Customer"}</strong>
                <p>{new Date(a.start_Time ?? a.Start_Time).toLocaleString()}</p>
                <p>Doctor ID: {a.dentist_ID ?? a.Dentist_ID}</p>
                <p>DOB: {a.customer_Date_Of_Birth ?? a.Customer_Date_Of_Birth ?? "N/A"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AllAppointmentsPage;
