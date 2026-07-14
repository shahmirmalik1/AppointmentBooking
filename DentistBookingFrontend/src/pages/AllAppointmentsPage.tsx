import { useEffect, useState } from "react";
import { GetAllAppointments, GetAllDoctors } from "../services/APIService";

function AllAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctorNamesById, setDoctorNamesById] = useState<Record<number, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [a, doctors] = await Promise.all([GetAllAppointments(), GetAllDoctors()]);
        setAppointments(a || []);

        const byId: Record<number, string> = {};
        (doctors || []).forEach((doctor: any) => {
          const id = doctor.id ?? doctor.ID;
          if (typeof id !== "number") return;
          const firstName = doctor.first_Name ?? doctor.First_Name ?? "";
          const lastName = doctor.last_Name ?? doctor.Last_Name ?? "";
          const fullName = `${firstName} ${lastName}`.trim();
          byId[id] = fullName || `Doctor #${id}`;
        });
        setDoctorNamesById(byId);
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
            (() => {
              const doctorId = a.dentist_ID ?? a.Dentist_ID;
              const doctorName = typeof doctorId === "number"
                ? (doctorNamesById[doctorId] ?? `Doctor #${doctorId}`)
                : "Unknown doctor";

              return (
                <div key={a.id ?? a.ID} className="list-row">
                  <div>
                    <strong>{a.customer_Full_Name ?? a.Customer_Full_Name ?? "Customer"}</strong>
                    <p>{new Date(a.start_Time ?? a.Start_Time).toLocaleString()}</p>
                    <p><strong>Doctor:</strong> {doctorName}</p>
                    <p>DOB: {a.customer_Date_Of_Birth ?? a.Customer_Date_Of_Birth ?? "N/A"}</p>
                  </div>
                </div>
              );
            })()
          ))}
        </div>
      </div>
    </div>
  );
}

export default AllAppointmentsPage;
