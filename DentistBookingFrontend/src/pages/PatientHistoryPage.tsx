import { useEffect, useMemo, useState } from "react";
import { GetPatientHistory, GetPatientHistoryDetails } from "../services/APIService";

function PatientHistoryPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [patientHistory, setPatientHistory] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [dobFilter, setDobFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await GetPatientHistory();
        setPatients(data || []);
      } catch (error) {
        console.error("Failed to load patient history list", error);
      }
    };

    load();
  }, []);

  const handleSelectPatient = async (patient: any) => {
    setSelectedPatient(patient);
    setIsHistoryModalOpen(true);
    setLoadingDetails(true);
    try {
      const fullName = patient.customer_Full_Name ?? patient.Customer_Full_Name;
      const dateOfBirth = patient.customer_Date_Of_Birth ?? patient.Customer_Date_Of_Birth;
      const details = await GetPatientHistoryDetails(fullName, dateOfBirth);
      setPatientHistory(details);
    } catch (error) {
      console.error("Failed to load patient history details", error);
      setPatientHistory(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setSelectedPatient(null);
    setPatientHistory(null);
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const fullName = (patient.customer_Full_Name ?? patient.Customer_Full_Name ?? "").toString();
      const dateOfBirth = (patient.customer_Date_Of_Birth ?? patient.Customer_Date_Of_Birth ?? "").toString();

      const matchesName = !nameFilter || fullName.toLowerCase().includes(nameFilter.trim().toLowerCase());
      const matchesDob = !dobFilter || dateOfBirth === dobFilter;

      return matchesName && matchesDob;
    });
  }, [patients, nameFilter, dobFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));

  const pagedPatients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [nameFilter, dobFilter]);

  const clearFilters = () => {
    setNameFilter("");
    setDobFilter("");
    setCurrentPage(1);
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!isHistoryModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeHistoryModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isHistoryModalOpen]);

  return (
    <div className="page-layout">
      <div className="form-card booking-form patient-history-shell">
        <div className="form-header">
          <p className="eyebrow">View</p>
          <h1>Patient history</h1>
          <p className="form-description">
            Patients are grouped by unique combination of full name and date of birth.
          </p>
        </div>

        <div className="patient-list-panel">
          <h2 className="section-title">Patients</h2>
          <div className="patient-filter-row">
            <input
              type="text"
              className="form-input"
              placeholder="Search by patient name"
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
            />
            <input
              type="date"
              className="form-input"
              value={dobFilter}
              onChange={(event) => setDobFilter(event.target.value)}
            />
            <button
              type="button"
              className="button button-secondary patient-clear-filters"
              onClick={clearFilters}
              disabled={!nameFilter && !dobFilter}
            >
              Clear Filters
            </button>
          </div>
          <div className="list-grid">
            {pagedPatients.map((patient, index) => {
              const fullName = patient.customer_Full_Name ?? patient.Customer_Full_Name;
              const dateOfBirth = patient.customer_Date_Of_Birth ?? patient.Customer_Date_Of_Birth;
              const count = patient.appointment_Count ?? patient.Appointment_Count ?? 0;

              return (
                <button
                  key={`${fullName}-${dateOfBirth}-${index}`}
                  type="button"
                  className="list-row patient-list-item"
                  onClick={() => handleSelectPatient(patient)}
                >
                  <strong>{fullName}</strong>
                  <p>DOB: {dateOfBirth}</p>
                  <p>Appointments: {count}</p>
                </button>
              );
            })}
            {filteredPatients.length === 0 && (
              <p className="form-note">No patients match the current filters.</p>
            )}
          </div>
          <div className="patient-pagination">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {isHistoryModalOpen && selectedPatient && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeHistoryModal}>
          <div className="modal-card patient-history-modal" onClick={(event) => event.stopPropagation()}>
            <div className="patient-history-modal-header">
              <div>
                <h2>{selectedPatient.customer_Full_Name ?? selectedPatient.Customer_Full_Name}</h2>
                <p>
                  DOB: {selectedPatient.customer_Date_Of_Birth ?? selectedPatient.Customer_Date_Of_Birth}
                </p>
              </div>
              <button
                type="button"
                className="button button-secondary patient-history-modal-close"
                onClick={closeHistoryModal}
              >
                Close
              </button>
            </div>

            {loadingDetails ? (
              <p className="form-note">Loading history...</p>
            ) : !patientHistory || !(patientHistory.appointments ?? patientHistory.Appointments)?.length ? (
              <p className="form-note">No appointments found for this patient.</p>
            ) : (
              <div className="list-grid patient-history-modal-list">
                {(patientHistory.appointments ?? patientHistory.Appointments).map((appointment: any) => {
                  const startTime = appointment.start_Time ?? appointment.Start_Time;
                  const duration = appointment.duration_mins ?? appointment.Duration_mins;
                  const doctorName = appointment.dentist_Full_Name ?? appointment.Dentist_Full_Name;
                  const procedure = appointment.procedure_Name ?? appointment.Procedure_Name ?? "N/A";
                  const notes = appointment.notes ?? appointment.Notes ?? "";
                  const completed = appointment.completed ?? appointment.Completed;
                  const email = appointment.customer_Email_Address ?? appointment.Customer_Email_Address ?? "N/A";
                  const phone = appointment.customer_Phone_Number ?? appointment.Customer_Phone_Number;

                  return (
                    <div key={appointment.id ?? appointment.ID} className="list-row patient-history-row">
                      <strong>{new Date(startTime).toLocaleString()}</strong>
                      <p><strong>Doctor:</strong> {doctorName}</p>
                      <p><strong>Duration:</strong> {duration} mins</p>
                      <p><strong>Procedure:</strong> {procedure}</p>
                      <p><strong>Phone:</strong> {phone || "N/A"}</p>
                      <p><strong>Email:</strong> {email || "N/A"}</p>
                      <p><strong>Status:</strong> {completed ? "Completed" : "Pending"}</p>
                      <p><strong>Notes:</strong> {notes || "None"}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientHistoryPage;
