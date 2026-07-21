import { useEffect, useMemo, useState } from "react";
import {
  ConfirmDoctorQuery,
  GetAllQueries,
  MoveDoctorQuery,
  RejectDoctorQuery,
} from "../services/APIService";

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
  if (value === "move appointment") return "Move Appointment";
  return "Pending";
}

function AllQueriesPage() {
  const [queries, setQueries] = useState<any[]>([]);
  const [nameFilterInput, setNameFilterInput] = useState("");
  const [statusFilterInput, setStatusFilterInput] = useState("All");
  const [dateTimeFilterInput, setDateTimeFilterInput] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateTimeFilter, setDateTimeFilter] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loadingQueryId, setLoadingQueryId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await GetAllQueries();
        setQueries(data || []);
      } catch (error) {
        console.error("Failed to load all queries", error);
      }
    };

    load();
  }, []);

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

  const applyFilters = () => {
    setNameFilter(nameFilterInput);
    setStatusFilter(statusFilterInput);
    setDateTimeFilter(dateTimeFilterInput);
  };

  const handleStatusChange = async (queryId: number, nextStatus: string) => {
    if (!nextStatus) return;

    setStatusMessage("");
    setLoadingQueryId(queryId);
    try {
      if (nextStatus === "Accepted") {
        await ConfirmDoctorQuery(queryId);
      } else if (nextStatus === "Rejected") {
        await RejectDoctorQuery(queryId);
      } else if (nextStatus === "Move Appointment") {
        await MoveDoctorQuery(queryId);
      }

      setQueries((previous) =>
        previous.map((query) => {
          const currentId = query.id ?? query.ID;
          if (currentId !== queryId) return query;
          return {
            ...query,
            status: nextStatus,
            Status: nextStatus,
          };
        })
      );
      setStatusMessage(`Query ${queryId} updated to ${nextStatus}.`);
    } catch (error) {
      console.error("Failed to update query status", error);
      setStatusMessage("Unable to update query status. Please try again.");
    } finally {
      setLoadingQueryId(null);
    }
  };

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
            value={nameFilterInput}
            onChange={(e) => setNameFilterInput(e.target.value)}
          />

          <input
            className="form-input"
            type="datetime-local"
            value={dateTimeFilterInput}
            onChange={(e) => setDateTimeFilterInput(e.target.value)}
          />

          <select
            className="form-input"
            value={statusFilterInput}
            onChange={(e) => setStatusFilterInput(e.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Move Appointment">Move appointment</option>
          </select>

          <button type="button" className="button button-primary" onClick={applyFilters}>
            Go
          </button>
        </div>

        <p className="form-note">Showing {filteredQueries.length} of {queries.length} queries.</p>
        {statusMessage && <p className="form-note">{statusMessage}</p>}

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
                    <div className="query-actions">
                      <select
                        className="form-input"
                        value={status}
                        onChange={(e) => handleStatusChange(queryId, e.target.value)}
                        disabled={loadingQueryId === queryId}
                      >
                        <option value="Accepted" disabled={status === "Accepted"}>Accept</option>
                        <option value="Rejected" disabled={status === "Rejected"}>Reject</option>
                        <option value="Move Appointment" disabled={status === "Move Appointment"}>Move appointment</option>
                      </select>
                    </div>
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
