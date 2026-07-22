import { useEffect, useState } from "react";
import { GetAllProcedures } from "../services/APIService";

function AllProceduresPage() {
  const [procedures, setProcedures] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await GetAllProcedures();
        setProcedures(data || []);
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
          <h1>All procedures</h1>
        </div>

        <div className="list-grid">
          {procedures.map((procedure) => {
            const id = procedure.id ?? procedure.ID;
            const name = procedure.procedure_Name ?? procedure.Procedure_Name ?? "Unnamed procedure";
            const duration = procedure.procedure_Duration_mins ?? procedure.Procedure_Duration_mins;
            const price = procedure.price ?? procedure.Price;

            return (
              <div key={id} className="list-row">
                <div>
                  <strong>{name}</strong>
                  <p>Duration: {duration ?? "N/A"} mins</p>
                  <p>Price: {price ?? "N/A"}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AllProceduresPage;
