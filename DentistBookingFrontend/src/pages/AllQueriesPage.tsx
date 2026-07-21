import { useEffect, useMemo, useState } from "react";
import {
  GetAllQueries,
  UpdateDoctorQueryStatus,
} from "../services/APIService";

function toDayString(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const [dateFilterInput, setDateFilterInput] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loadingQueryId, setLoadingQueryId] = useState<number | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Record<number, string>>({});

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
      if (status === "Pending") return false;

      const queryDateRaw = query.date_Time ?? query.Date_Time;
      const queryDate = queryDateRaw ? new Date(queryDateRaw) : null;
      const queryDateDay = queryDate ? toDayString(queryDate) : "";

      const matchesName = !nameFilter || fullName.includes(nameFilter.trim().toLowerCase());
      const matchesStatus = statusFilter === "All" || status === statusFilter;
      const matchesDate = !dateFilter || queryDateDay === dateFilter;

      return matchesName && matchesStatus && matchesDate;
    });
  }, [queries, nameFilter, statusFilter, dateFilter]);

  const { upcomingQueries, pastQueries } = useMemo(() => {
    const now = new Date().getTime();
    const upcoming: any[] = [];
    const past: any[] = [];

    for (const query of filteredQueries) {
      const queryDateRaw = query.date_Time ?? query.Date_Time;
      const queryDate = queryDateRaw ? new Date(queryDateRaw) : null;
      if (queryDate && queryDate.getTime() < now) {
        past.push(query);
      } else {
        upcoming.push(query);
      }
    }

    return {
      upcomingQueries: upcoming,
      pastQueries: past,
    };
  }, [filteredQueries]);

  const applyFilters = () => {
    setNameFilter(nameFilterInput);
    setStatusFilter(statusFilterInput);
    setDateFilter(dateFilterInput);
  };

  const handleStatusSelection = (queryId: number, nextStatus: string) => {
    setSelectedStatuses((previous) => ({
      ...previous,
      [queryId]: nextStatus,
    }));
  };

  const handleStatusSubmit = async (query: any, forcedStatus?: string) => {
    const queryId = query.id ?? query.ID;
    const currentStatus = normalizeStatus(query.status ?? query.Status);
    const nextStatus = forcedStatus ?? selectedStatuses[queryId] ?? currentStatus;

    if (nextStatus === currentStatus) {
      setStatusMessage("Choose a different status before submitting.");
      return;
    }

    const confirmed = window.confirm("Are you sure?");
    if (!confirmed) return;

    setStatusMessage("");
    setLoadingQueryId(queryId);
    try {
      await UpdateDoctorQueryStatus(queryId, nextStatus);

      setQueries((previous) =>
        previous.map((item) => {
          const currentId = item.id ?? item.ID;
          if (currentId !== queryId) return item;
          return {
            ...item,
            status: nextStatus,
            Status: nextStatus,
          };
        })
      );
      setSelectedStatuses((previous) => {
        const updated = { ...previous };
        delete updated[queryId];
        return updated;
      });
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
          <p className="form-description">Filter by patient name, date, and query status.</p>
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
            type="date"
            value={dateFilterInput}
            onChange={(e) => setDateFilterInput(e.target.value)}
          />

          <select
            className="form-input"
            value={statusFilterInput}
            onChange={(e) => setStatusFilterInput(e.target.value)}
          >
            <option value="All">All statuses</option>
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
          <div className="query-sections">
            <div>
              <h2 className="section-title">Upcoming queries</h2>
              {upcomingQueries.length === 0 ? (
                <p className="form-note">No upcoming queries.</p>
              ) : (
                <div className="query-grid">
                  {upcomingQueries.map((query) => {
                    const queryId = query.id ?? query.ID;
                    const status = normalizeStatus(query.status ?? query.Status);
                    const selectedStatus = selectedStatuses[queryId] ?? status;
                    const queryDateRaw = query.date_Time ?? query.Date_Time;
                    const queryDate = queryDateRaw ? new Date(queryDateRaw) : null;
                    const statusClass = status === "Accepted" ? "confirmed" : status === "Rejected" ? "rejected" : "pending";

                    return (
                      <div key={`upcoming-${queryId}`} className="query-card">
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
                              className="form-input query-status-select"
                              value={selectedStatus}
                              onChange={(e) => handleStatusSelection(queryId, e.target.value)}
                              disabled={loadingQueryId === queryId}
                            >
                              <option value="Accepted" disabled={status === "Accepted"}>Accept</option>
                              <option value="Rejected" disabled={status === "Rejected"}>Reject</option>
                              <option value="Move Appointment" disabled={status === "Move Appointment"}>Move appointment</option>
                            </select>
                            <button
                              type="button"
                              className="button button-primary"
                              onClick={() => handleStatusSubmit(query)}
                              disabled={loadingQueryId === queryId || selectedStatus === status}
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h2 className="section-title">Past appointments</h2>
              {pastQueries.length === 0 ? (
                <p className="form-note">No past appointments.</p>
              ) : (
                <div className="query-grid">
                  {pastQueries.map((query) => {
                    const queryId = query.id ?? query.ID;
                    const status = normalizeStatus(query.status ?? query.Status);
                    const queryDateRaw = query.date_Time ?? query.Date_Time;
                    const queryDate = queryDateRaw ? new Date(queryDateRaw) : null;
                    const statusClass = status === "Accepted" ? "confirmed" : status === "Rejected" ? "rejected" : "pending";

                    return (
                      <div key={`past-${queryId}`} className="query-card">
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
                              className="form-input query-status-select"
                              value="Move Appointment"
                              disabled={loadingQueryId === queryId || status === "Move Appointment"}
                            >
                              <option value="Move Appointment">Move appointment</option>
                            </select>
                            <button
                              type="button"
                              className="button button-primary"
                              onClick={() => handleStatusSubmit(query, "Move Appointment")}
                              disabled={loadingQueryId === queryId || status === "Move Appointment"}
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AllQueriesPage;
