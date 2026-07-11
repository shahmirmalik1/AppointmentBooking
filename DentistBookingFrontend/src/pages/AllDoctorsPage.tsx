import { useEffect, useState } from "react";
import { GetAllDoctors } from "../services/APIService";

function AllDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);

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

  return (
    <div className="page-layout">
      <div className="form-card booking-form">
        <div className="form-header">
          <p className="eyebrow">Admin</p>
          <h1>All doctors</h1>
        </div>

        <div className="list-grid">
          {doctors.map(d => (
            <div key={d.id} className="list-row">
              <div>
                <strong>{d.first_Name} {d.last_Name}</strong>
                <p>{d.email_Address}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AllDoctorsPage;
