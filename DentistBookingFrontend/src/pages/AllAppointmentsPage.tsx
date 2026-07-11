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
            <div key={a.id} className="list-row">
              <div>
                <strong>{a.customer_Name || (a.customer ? `${a.customer.first_Name} ${a.customer.last_Name}` : "Customer")}</strong>
                <p>{new Date(a.start_Time ?? a.Start_Time).toLocaleString()}</p>
                <p>Doctor ID: {a.dentist_ID ?? a.Dentist_ID}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AllAppointmentsPage;
