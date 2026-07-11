import { useState, useEffect } from "react";
import { GetAllDoctors, GetAllProcedures, GetAllDoctorsForProcedure, CreateAQuery, GetDoctorFreeTimes } from "../services/APIService";

function BookAppointmentPage() {
  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    phone: "",
    procedureid: "",
    doctorid: "",
    time: "",
    additionalInfo: "",
  });
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [procedures, setProcedures] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  const selectedSlotDate = form.time
    ? new Date(`${selectedDate}T${form.time}`)
    : null;
  const selectedProcedure = procedures.find((p) => String(p.id) === String(form.procedureid));
  const selectedDoctor = doctors.find((d) => String(d.id) === String(form.doctorid));
  const procedurePrice = selectedProcedure ? (selectedProcedure.Price ?? selectedProcedure.price ?? 0) : 0;
  const formattedPrice = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(procedurePrice);

  useEffect(() => {
    const loadProcedures = async () => {
      try {
        const data = await GetAllProcedures();
        setProcedures(data);
      } catch (error) {
        console.error("Failed to load procedures", error);
      }
    };

    loadProcedures();
  }, []);

  useEffect(() => {
    const loadDoctorsForProcedure = async () => {
      if (!form.procedureid) {
        const data = await GetAllDoctors();
        setDoctors(data);
        return;
      }

      try {
        const data = await GetAllDoctorsForProcedure(Number(form.procedureid));
        setDoctors(data);
      } catch (error) {
        console.error("Failed to load doctors for procedure", error);
      }
    };

    loadDoctorsForProcedure();
  }, [form.procedureid]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (e.target.name === "procedureid") {
      setForm({
        ...form,
        procedureid: e.target.value,
        doctorid: "",
        time: "",
      });
      return;
    }

    if (e.target.name === "doctorid") {
      setForm({
        ...form,
        doctorid: e.target.value,
        time: "",
      });
      return;
    }

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.firstName ||
      !form.surname ||
      !form.email ||
      !form.phone ||
      !form.procedureid ||
      !form.doctorid ||
      !form.time
    ) {
      alert("Please complete all required fields.");
      return;
    }
    // Submit immediately (summary is always visible)

    try {
      const appointmentDateTime = new Date(`${selectedDate}T${form.time}`);

      const query = {
        First_Name: form.firstName,
        Surname: form.surname,
        Email_Address: form.email,
        Phone_Number: form.phone,
        Procedure_ID: Number(form.procedureid),
        Doctor_ID: Number(form.doctorid),
        Date_Time: appointmentDateTime.toISOString(),
        Additional_Information: form.additionalInfo,
      };

      await CreateAQuery(query);

      alert("Thank you. Your appointment request has been submitted.");
      setForm({
        firstName: "",
        surname: "",
        email: "",
        phone: "",
        procedureid: "",
        doctorid: "",
        time: "",
        additionalInfo: "",
      });
    } catch (error) {
      console.error(error);
      alert("There was a problem submitting your request.");
    }
  };

  useEffect(() => {
    const loadTimes = async () => {
      if (!form.doctorid || !selectedDate) {
        setAvailableTimes([]);
        return;
      }

      try {
        const data = await GetDoctorFreeTimes(Number(form.doctorid), selectedDate);
        setAvailableTimes(data);
      } catch (error) {
        console.error("Failed to load available times", error);
      }
    };

    loadTimes();
  }, [form.doctorid, selectedDate]);

  return (
    <div className="page-layout">
      <form className="form-card booking-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <p className="eyebrow">Appointment booking</p>
          <h1>Book an appointment</h1>
          <p className="form-description">
            Complete your details below so we can arrange the right doctor and time for you.
          </p>
        </div>

        <input
          name="firstName"
          placeholder="First Name"
          value={form.firstName}
          onChange={handleChange}
          className="form-input"
        />

        <input
          name="surname"
          placeholder="Surname"
          value={form.surname}
          onChange={handleChange}
          className="form-input"
        />

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="form-input"
        />

        <input
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="form-input"
        />

        <select
          name="procedureid"
          value={form.procedureid}
          onChange={handleChange}
          className="form-input"
        >
          <option value="">Select Procedure</option>
          {procedures.map((procedure) => (
            <option key={procedure.id} value={procedure.id}>
              {procedure.procedure_Name}
            </option>
          ))}
        </select>

        <p className="form-note">
          If you do not see a procedure that you want in the dropdown list, please choose "Other" and write the details below.
        </p>

        <select
          name="doctorid"
          value={form.doctorid}
          onChange={handleChange}
          className="form-input"
        >
          <option value="">Select Doctor</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.first_Name} {doctor.last_Name}
            </option>
          ))}
        </select>

        <div className="date-row">
          <label className="form-label" htmlFor="appointment-date">
            Choose appointment date
          </label>
          <input
            id="appointment-date"
            type="date"
            value={selectedDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setForm({ ...form, time: "" });
            }}
            className="form-input"
            disabled={!form.doctorid}
          />
        </div>

        <div className="slot-section">
          <div className="slot-section-header">
            <div>
              <h2>Available times</h2>
              <p className="form-note">
                {form.doctorid
                  ? `Slots for ${new Date(selectedDate).toLocaleDateString()}`
                  : "Select a doctor first to see available slots."}
              </p>
            </div>
            {selectedSlotDate && (
              <div className="selected-slot">
                <span>Selected slot</span>
                <strong>
                  {selectedSlotDate.toLocaleString([], {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>
              </div>
            )}
          </div>

          {form.doctorid ? (
            availableTimes.length > 0 ? (
              <div className="slot-grid">
                {availableTimes.map((time) => {
                  const slotDate = new Date(time);
                  const slotValue = slotDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  });
                  const formattedDate = slotDate.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  });
                  return (
                    <button
                      type="button"
                      key={time}
                      className={`slot-card ${form.time === slotValue ? "selected" : ""}`}
                      onClick={() => setForm({ ...form, time: slotValue })}
                    >
                      <time>{slotValue}</time>
                      <span>{formattedDate}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="slot-grid-empty">
                {form.doctorid && selectedDate
                  ? "No available slots found for this date. Try another day."
                  : "Select a doctor and date to see available slots."}
              </div>
            )
          ) : null}
        </div>

        <div className="summary-card">
          <h3>Appointment summary</h3>
          <p><strong>Procedure:</strong> {selectedProcedure ? selectedProcedure.procedure_Name : "-"} </p>
          <p><strong>Price:</strong> {selectedProcedure ? formattedPrice : "-"} </p>
          <p><strong>Doctor:</strong> {selectedDoctor ? `${selectedDoctor.first_Name} ${selectedDoctor.last_Name}` : "-"}</p>
          <p><strong>Date & Time:</strong> {selectedSlotDate ? selectedSlotDate.toLocaleString() : "-"}</p>
          <p><strong>Patient:</strong> {form.firstName} {form.surname}</p>
          <p className="form-note">The summary updates as you change selections.</p>
        </div>

        <textarea
          name="additionalInfo"
          placeholder="Additional Information"
          value={form.additionalInfo}
          onChange={handleChange}
          className="form-textarea"
        />

        <button type="submit" className="button button-primary">
          Confirm Booking
        </button>
      </form>
    </div>
  );
}

export default BookAppointmentPage;
