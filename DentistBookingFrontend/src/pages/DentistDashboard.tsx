import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GetDoctorQueries,
  GetDoctorAppointments,
  GetDentistProfile,
  UpdateDentistProfile,
  ConfirmDoctorQuery,
  RejectDoctorQuery,
} from "../services/APIService";

function DentistDashboard() {
  const navigate = useNavigate();
  const [dentist, setDentist] = useState<{ ID: number; First_Name: string; Last_Name: string } | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [queries, setQueries] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("queries");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [statusMessage, setStatusMessage] = useState("");
  const [loadingQueryId, setLoadingQueryId] = useState<number | null>(null);
  const [rejectQueryId, setRejectQueryId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [moveQueryId, setMoveQueryId] = useState<number | null>(null);
  const [moveReason, setMoveReason] = useState("");
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const normalizeDentist = (saved: any) => ({
    ID: saved.ID ?? saved.id,
    First_Name: saved.First_Name ?? saved.first_Name ?? "",
    Last_Name: saved.Last_Name ?? saved.last_Name ?? "",
    Email_Address: saved.Email_Address ?? saved.email_Address ?? "",
    Phone_Number: saved.Phone_Number ?? saved.phone_Number ?? "",
    Role: saved.Role ?? saved.role ?? "",
  });

  const isPendingStatus = (status: string | null | undefined) => {
    const normalized = (status ?? "Pending").toString().trim().toLowerCase();
    return normalized !== "accepted" && normalized !== "rejected";
  };

  const toDayKey = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const saved = localStorage.getItem("dentist");
    if (saved) {
      const parsed = normalizeDentist(JSON.parse(saved));
      setDentist(parsed);
    }
  }, []);

  const refreshQueries = async () => {
    if (!dentist) return;
    try {
      const queryData = await GetDoctorQueries(dentist.ID);
      const pendingQueries = (queryData || []).filter((q: any) =>
        isPendingStatus(q.status ?? q.Status)
      );
      setQueries(pendingQueries);
    } catch (error) {
      console.error("Failed to load queries", error);
    }
  };

  const refreshAppointments = async () => {
    if (!dentist) return;
    try {
      const appointmentData = await GetDoctorAppointments(dentist.ID);
      setAppointments(appointmentData || []);
    } catch (error) {
      console.error("Failed to load appointments", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!dentist) return;

      try {
        const [profileData, queryData, appointmentData] = await Promise.all([
          GetDentistProfile(dentist.ID),
          GetDoctorQueries(dentist.ID),
          GetDoctorAppointments(dentist.ID),
        ]);

        setProfile(profileData);
        const pendingQueries = (queryData || []).filter((q: any) =>
          isPendingStatus(q.status ?? q.Status)
        );
        setQueries(pendingQueries);
        setAppointments(appointmentData || []);
        setProfileForm({
          firstName: profileData.first_Name ?? profileData.First_Name ?? "",
          lastName: profileData.last_Name ?? profileData.Last_Name ?? "",
          email: profileData.email_Address ?? profileData.Email_Address ?? "",
          phone: profileData.phone_Number ?? profileData.Phone_Number ?? "",
          password: "",
          confirmPassword: "",
        });
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
    };

    loadData();
  }, [dentist]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage("");

    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      setStatusMessage("New passwords do not match.");
      return;
    }

    try {
      const updatePayload: any = {};
      const current = profile || {};
      const firstName = profileForm.firstName.trim();
      const lastName = profileForm.lastName.trim();
      const email = profileForm.email.trim();
      const phone = profileForm.phone.trim();

      if (firstName && firstName !== (current.first_Name ?? current.First_Name)) updatePayload.First_Name = firstName;
      if (lastName && lastName !== (current.last_Name ?? current.Last_Name)) updatePayload.Last_Name = lastName;
      if (email && email !== (current.email_Address ?? current.Email_Address)) updatePayload.Email_Address = email;
      if (phone && phone !== (current.phone_Number ?? current.Phone_Number)) updatePayload.Phone_Number = phone;
      if (profileForm.password) updatePayload.Password = profileForm.password;

      if (Object.keys(updatePayload).length === 0) {
        setStatusMessage("No changes detected. Update only the fields you want to change.");
        return;
      }

      const updated = await UpdateDentistProfile(dentist!.ID, updatePayload);
      const normalizedUpdated = normalizeDentist(updated);
      setDentist(normalizedUpdated);
      setProfile(updated);
      localStorage.setItem("dentist", JSON.stringify(normalizedUpdated));
      window.dispatchEvent(new Event("dentist-auth-changed"));
      setStatusMessage("Profile updated successfully.");
      setProfileForm({ ...profileForm, password: "", confirmPassword: "" });
    } catch (error: any) {
      console.error("Failed to update profile", error);
      setStatusMessage("Unable to update profile. Please try again.");
    }
  };

  const handleAcceptQuery = async (queryId: number) => {
    setStatusMessage("");
    setLoadingQueryId(queryId);
    try {
      await ConfirmDoctorQuery(queryId);
      setStatusMessage("Appointment request accepted.");
      await refreshQueries();
      await refreshAppointments();
    } catch (error) {
      console.error("Failed to accept appointment request", error);
      setStatusMessage("Unable to accept appointment. Please try again.");
    } finally {
      setLoadingQueryId(null);
    }
  };

  const requestRejectQuery = (queryId: number) => {
    setRejectQueryId(queryId);
    setRejectReason("");
  };

  const cancelReject = () => {
    setRejectQueryId(null);
    setRejectReason("");
  };

  const confirmRejectQuery = async () => {
    if (rejectQueryId == null) return;

    setStatusMessage("");
    setLoadingQueryId(rejectQueryId);
    try {
      await RejectDoctorQuery(rejectQueryId);
      setStatusMessage(`Appointment request rejected.${rejectReason ? ` Reason: ${rejectReason}` : ""}`);
      await refreshQueries();
    } catch (error) {
      console.error("Failed to reject appointment request", error);
      setStatusMessage("Unable to reject appointment. Please try again.");
    } finally {
      setLoadingQueryId(null);
      setRejectQueryId(null);
      setRejectReason("");
    }
  };

  const appointmentsByDay = useMemo(() => {
    const grouped = new Map<string, any[]>();
    for (const appt of appointments) {
      const rawDate = appt.start_Time ?? appt.Start_Time;
      if (!rawDate) continue;
      const date = new Date(rawDate);
      const key = toDayKey(date);
      const list = grouped.get(key) ?? [];
      list.push(appt);
      grouped.set(key, list);
    }

    grouped.forEach((list) => {
      list.sort((a, b) => {
        const aDate = new Date(a.start_Time ?? a.Start_Time).getTime();
        const bDate = new Date(b.start_Time ?? b.Start_Time).getTime();
        return aDate - bDate;
      });
    });

    return grouped;
  }, [appointments]);

  const calendarCells = useMemo(() => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startWeekday = monthStart.getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const cells: Array<number | null> = [];

    for (let i = 0; i < startWeekday; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(day);
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [currentMonth]);

  const monthLabel = currentMonth.toLocaleString([], {
    month: "long",
    year: "numeric",
  });

  const shiftMonth = (offset: number) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const requestMoveQuery = (queryId: number) => {
    setMoveQueryId(queryId);
    setMoveReason("");
  };

  const cancelMove = () => {
    setMoveQueryId(null);
    setMoveReason("");
  };

  const confirmMoveQuery = async () => {
    if (moveQueryId == null) return;

    setStatusMessage("");
    setLoadingQueryId(moveQueryId);
    try {
      setStatusMessage(`Move appointment requested.${moveReason ? ` Note: ${moveReason}` : ""}`);
      setMoveQueryId(null);
      setMoveReason("");
    } catch (error) {
      console.error("Failed to request appointment move", error);
      setStatusMessage("Unable to move appointment. Please try again.");
    } finally {
      setLoadingQueryId(null);
    }
  };

  if (!dentist) {
    return (
      <div className="page-layout">
        <div className="form-card booking-form">
          <h1>Access denied</h1>
          <p>Please login first to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-layout">
      <div className="form-card booking-form dashboard-card">
        <div className="form-header">
          <p className="eyebrow">Dentist dashboard</p>
          <h1>Welcome back, {dentist.First_Name}</h1>
          <p className="form-description">
            Manage your patient queries and keep your contact information up to date.
          </p>
          <div className="dashboard-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate("/all-queries")}
            >
              View all queries
            </button>
          </div>
        </div>

        <div className="tab-bar">
          <button
            type="button"
            className={`tab-button ${activeTab === "queries" ? "active" : ""}`}
            onClick={() => setActiveTab("queries")}
          >
            Queries
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === "calendar" ? "active" : ""}`}
            onClick={() => setActiveTab("calendar")}
          >
            Calendar
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === "details" ? "active" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            Personal details
          </button>
        </div>

        {rejectQueryId != null && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Reject appointment request</h2>
              <p>Enter a short reason for the rejection so the patient understands why.</p>
              <textarea
                className="textarea-input"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional)"
                rows={4}
              />
              <div className="modal-actions">
                <button type="button" className="button button-secondary" onClick={cancelReject}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="button button-danger"
                  onClick={confirmRejectQuery}
                  disabled={loadingQueryId === rejectQueryId}
                >
                  Reject appointment
                </button>
              </div>
            </div>
          </div>
        )}
        {moveQueryId != null && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Move appointment request</h2>
              <p>Provide a note explaining why this appointment should be moved.</p>
              <textarea
                className="textarea-input"
                value={moveReason}
                onChange={(e) => setMoveReason(e.target.value)}
                placeholder="Reason or note for moving the appointment"
                rows={4}
              />
              <div className="modal-actions">
                <button type="button" className="button button-secondary" onClick={cancelMove}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={confirmMoveQuery}
                  disabled={loadingQueryId === moveQueryId}
                >
                  Move appointment
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "queries" ? (
          <div className="query-list">
            {queries.length === 0 ? (
              <p className="form-note">No queries have been submitted for your account yet.</p>
            ) : (
              <div className="query-grid">
                {queries.map((query) => {
                  const requestedDate = query.date_Time ?? query.Date_Time
                    ? new Date(query.date_Time ?? query.Date_Time).toLocaleString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "No date provided";

                  const queryId = query.id ?? query.ID;
                  const status = query.status ?? query.Status ?? "Pending";
                  const normalizedStatus = status.toString().toLowerCase();
                  const statusLabel = normalizedStatus === "accepted"
                    ? "Accepted"
                    : normalizedStatus === "rejected"
                      ? "Rejected"
                      : "Pending";
                  const procedureName =
                    query.Procedure_Name ?? query.procedure_Name ??
                    query.procedure_ID ?? query.Procedure_ID ??
                    "N/A";

                  return (
                    <div key={queryId} className="query-card">
                      <div className="query-card-header">
                        <div>
                          <strong>{query.first_Name ?? query.First_Name} {query.surname ?? query.Surname}</strong>
                          <p>{query.email_Address ?? query.Email_Address}</p>
                        </div>
                        <span className={`badge ${normalizedStatus === "accepted" ? "confirmed" : "pending"}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="query-card-body">
                        <p><strong>Phone:</strong> {query.phone_Number ?? query.Phone_Number}</p>
                        <p><strong>Requested:</strong> {requestedDate}</p>
                        <p><strong>Procedure:</strong> {procedureName}</p>
                        <p><strong>Notes:</strong> {query.additional_Information ?? query.Additional_Information ?? "None"}</p>
                        <div className="query-actions">
                          <div className="query-actions-left">
                            <button
                              type="button"
                              className="button button-secondary"
                              onClick={() => requestMoveQuery(queryId)}
                              disabled={loadingQueryId === queryId}
                            >
                              Move appointment
                            </button>
                          </div>
                          <div className="query-actions-right">
                            <button
                              type="button"
                              className="accept-button"
                              onClick={() => handleAcceptQuery(queryId)}
                              disabled={loadingQueryId === queryId}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="reject-button"
                              onClick={() => requestRejectQuery(queryId)}
                              disabled={loadingQueryId === queryId}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "calendar" ? (
          <div className="calendar-view">
            <div className="calendar-toolbar">
              <button type="button" className="button button-secondary" onClick={() => shiftMonth(-1)}>
                Previous
              </button>
              <h2>{monthLabel}</h2>
              <button type="button" className="button button-secondary" onClick={() => shiftMonth(1)}>
                Next
              </button>
            </div>

            <div className="calendar-grid weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="calendar-weekday">{day}</div>
              ))}
            </div>

            <div className="calendar-grid days">
              {calendarCells.map((day, index) => {
                if (day == null) {
                  return <div key={`empty-${index}`} className="calendar-cell empty" />;
                }

                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const key = toDayKey(date);
                const dayAppointments = appointmentsByDay.get(key) ?? [];

                return (
                  <div key={key} className="calendar-cell">
                    <div className="calendar-date">{day}</div>
                    <div className="calendar-appointments">
                      {dayAppointments.length === 0 ? (
                        <p className="calendar-empty">No appointments</p>
                      ) : (
                        dayAppointments.map((appt, idx) => {
                          const start = new Date(appt.start_Time ?? appt.Start_Time);
                          return (
                            <div key={`${key}-${idx}`} className="calendar-appointment-item">
                              <strong>{appt.customer_Full_Name ?? appt.Customer_Full_Name ?? "Patient"}</strong>
                              <span>
                                {start.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <form className="profile-form" onSubmit={handleProfileSubmit}>
              <div className="profile-grid">
                <div>
                  <label className="form-label" htmlFor="firstName">First name</label>
                  <input
                  id="firstName"
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleProfileChange}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label" htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleProfileChange}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label" htmlFor="phone">Phone number</label>
                <input
                  id="phone"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label" htmlFor="password">New password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={profileForm.password}
                  onChange={handleProfileChange}
                  className="form-input"
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div>
                <label className="form-label" htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={profileForm.confirmPassword}
                  onChange={handleProfileChange}
                  className="form-input"
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            {statusMessage && <p className="form-note">{statusMessage}</p>}

            <button type="submit" className="button button-primary">
              Save changes
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default DentistDashboard;
