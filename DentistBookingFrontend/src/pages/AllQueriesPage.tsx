import { useEffect, useMemo, useState } from "react";
import { GetAllDoctorQueries } from "../services/APIService";

function toMinuteString(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizeStatus(status: string | null | undefined) {
  const value = (status ?? "Pending").toString().trim().toLowerCase();
  if (value === "accepted") return "Accepted";
  if (value === "rejected") return "Rejected";
  return "Pending";
}

function AllQueriesPage() {
  const [dentistId, setDentistId] = useState<number | null>(null);
  const [queries, setQueries] = useState<any[]>([]);
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateTimeFilter, setDateTimeFilter] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("dentist");
    if (!saved) return;

    const parsed = JSON.parse(saved);
    setDentistId(parsed.ID ?? parsed.id ?? null);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!dentistId) return;
      try {
        const data = await GetAllDoctorQueries(dentistId);
        setQueries(data || []);
      } catch (error) {
        console.error("Failed to load all queries", error);
      }
    };

    load();
  }, [dentistId]);

  const filteredQueries = useMemo(() => {
    return queries.filter((query) => {
      const firstName = query.first_Name ?? query.First_Name ?? "";
      const surname = query.surname ?? query.Surname ?? "";
      const fullName = `${firstName} ${surname}`.trim().toLowerCase();
      const status = normalizeStatus(query.status ?? query.Status);
      const queryDateRaw = query.date_Time ?? query.Date_Time;
      const queryDate = queryDateRaw ? new Date(queryDateRaw) : null;
      const queryDateMinute = queryDate ? toMinuteString(queryDate) : "";

      const matchesName = !nameFilter || fullName.includes(nameFilter.trim().toLowerCase());
      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const matchesDateTime = !dateTimeFilter || queryDateMinute === dateTimeFilter;

      return matchesName && matchesStatus && matchesDateTime;
    });
  }, [queries, nameFilter, statusFilter, dateTimeFilter]);

  if (!dentistId) {
    return (
      <div className="page-layout">
        <div className="form-card booking-form">
          <h1>Access denied</h1>
          <p>Please login first to view all queries.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-layout">
      <div className="form-card booking-form dashboard-card">
        <div className="form-header">
          <p className="eyebrow">Dashboard</p>
          <h1>All queries</h1>
          <p className="form-description">Filter by patient name, exact date/time, and query status.</p>
        </div>

        <div className="query-filters">
          <input
            className="form-input"
            placeholder="Filter by patient name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />

          <input
            className="form-input"
            type="datetime-local"
            value={dateTimeFilter}
            onChange={(e) => setDateTimeFilter(e.target.value)}
          />

          <select
            className="form-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <p className="form-note">Showing {filteredQueries.length} of {queries.length} queries.</p>

        {filteredQueries.length === 0 ? (
          <p className="form-note">No queries match the selected filters.</p>
        ) : (
          <div className="query-grid">
            {filteredQueries.map((query) => {
              const queryId = query.id ?? query.ID;
              const status = normalizeStatus(query.status ?? query.Status);
              const queryDateRaw = query.date_Time ?? query.Date_Time;
              const queryDate = queryDateRaw ? new Date(queryDateRaw) : null;
              const statusClass = status === "Accepted" ? "confirmed" : status === "Rejected" ? "rejected" : "pending";

              return (
                <div key={queryId} className="query-card">
                  <div className="query-card-header">
                    <div>
                      <strong>{query.first_Name ?? query.First_Name} {query.surname ?? query.Surname}</strong>
                      <p>{query.email_Address ?? query.Email_Address}</p>
                    </div>
                    <span className={`badge ${statusClass}`}>{status}</span>
                  </div>
                  <div className="query-card-body">
                    <p><strong>Phone:</strong> {query.phone_Number ?? query.Phone_Number}</p>
                    <p><strong>Requested:</strong> {queryDate ? queryDate.toLocaleString() : "No date provided"}</p>
                    <p><strong>Procedure:</strong> {query.Procedure_Name ?? query.procedure_Name ?? "N/A"}</p>
                    <p><strong>Notes:</strong> {query.additional_Information ?? query.Additional_Information ?? "None"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AllQueriesPage;
